<?php
/*
    logcollector.php - Run this file to operate the log
    collector. When it is called from a shell script it
    will run once and exit.
*/
require_once './timezone.php';
require_once './rightnow.php';  // modified
// load the application options
$appopt = json_decode(file_get_contents('./appoptions.json'));
define('_OUTPATH', $appopt->outpath);
// load the IMAP connection parameters
$accnt = json_decode(file_get_contents('./_imapaccnt.json'));
// true or false
define('_READONLY', $accnt->isrdonly);
/*
    Mailbox Options: There are 4 items in the imapaccnt.json
    file that determine - 

        * If the mailbox is to be opened as "read only", and no 
          changes will be made to its messages.
        * If not "read only", then look at how a read message 
          is to be handled. Either mark it as "seen" or mark 
          it as "deleted".
        * If messages are to be expunged, either previously or
          currently marked as "deleted". There are 3 choices 
          for when expungement occurs (pick one):
            * "onclose" - messages will be expunged when the 
              connection is closed
            * "readbegin" - messages will be expunged just before 
              the headers are read.
            * "readend" - messages will be expunged after all
              have been read and/or marked.

*/
if(defined('_READONLY') &&  _READONLY === true) {
    define('_EXPUNGE', false);
} else {
    if(defined('_READONLY') &&  _READONLY === false) {
        // "seen" or "delete"
        define('_MSGDISPOSE', $accnt->disposemsg);
        // true or false
        define('_EXPUNGE', $accnt->expunge);
        // "onclose" "readbegin" "readend"
        define('_EXPWHERE', $accnt->expwhere);
    }
}

$imapsrv = "{$accnt->host}:{$accnt->port}/imap/ssl";
$mbox = "{{$imapsrv}}INBOX{$accnt->folder}";

// NOTE: the last arg is a "flag" - 
//      OP_READONLY = can only read, and cannot set flags!!
//       CL_EXPUNGE = expunges on close, but it is being done here explicitly
if(defined('_READONLY') && _READONLY === true) {
    $mailbox = imap_open($mbox, $accnt->login, $accnt->pword, OP_READONLY);
} else {
    if((defined('_READONLY') && _READONLY === false) &&
       (defined('_EXPUNGE') && _EXPUNGE === true) &&
       (defined('_EXPWHERE') && _EXPWHERE === 'onclose')) {
        $mailbox = imap_open($mbox, $accnt->login, $accnt->pword, CL_EXPUNGE);   
    } else {
        $mailbox = imap_open($mbox, $accnt->login, $accnt->pword);
    }
}

// check for success...
if($mailbox === false) {
    echo rightnow('log') . " - logcollector.php: Failed connection to server\n";
    exit(0);
}

// find out how many messages there are in the INBOX
// TODO: determine worth of $msgqty, remove is worthless
$msgqty = imap_num_msg($mailbox); 
if($msgqty === false) {
    echo rightnow('log') . " - logcollector.php: error calling imap_num_msg\n";
    exit(0);
} else {
    if($msgqty === 0) {
        echo rightnow('log') . " - logcollector.php: no messages\n";
        exit(0);
    }
}
// create defines that are used globally
define('_IMAPSRV',$imapsrv);
define('_MAILBOX',$mailbox);
define('_MSGQTY',$msgqty);
// this will manage the reading, parsing and output of the log files
require_once './msgmgr.php';
// done, close the connection
imap_close(_MAILBOX);
echo rightnow('log') . " - logcollector.php: complete, normal exit\n";
exit(0);
?>