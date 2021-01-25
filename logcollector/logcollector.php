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
$imapsrv = "{$accnt->host}:{$accnt->port}/imap/ssl";
// NOTE: the last arg is a "flag" - 
//      OP_READONLY = can only read, and cannot set flags
//       CL_EXPUNGE = expunges on close, but it is being done here explicitly
$mailbox = imap_open("{{$imapsrv}}INBOX", $accnt->login, $accnt->pword,  OP_READONLY );
if($mailbox === false) {
    echo rightnow('log') . " - logcollector.php: Failed to connect to server\n";
    exit(0);
}
// find out how many messages there are in the INBOX
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