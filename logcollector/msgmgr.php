<?php
/*
    msgmgr.php - manages the reading of the email log
    messages.
*/
require_once('./isLogMsg.php');
require_once('./logProcess.php');

if(!defined('_DELUNKOWN')) define('_DELUNKOWN', false);

// safety check, make sure we are connected
if(!defined('_IMAPSRV') || !defined('_MAILBOX')) {
    echo rightnow('log') . " - msgmgr.php: not connected\n";
    exit(0);
}

// if configured, get rid of any messages that were 
// marked for deletion before we read them.
if((defined('_READONLY') && _READONLY === false) &&
   (defined('_EXPUNGE') && _EXPUNGE === true) &&
   (defined('_EXPWHERE') && _EXPWHERE === 'readbegin')) {
        imap_expunge(_MAILBOX);
}

$mcount = imap_num_msg(_MAILBOX);
for($num = 1;$num <= $mcount; $num++) {
    $msghdr = isLogMsg($num, _DELUNKOWN);
    if($msghdr !== false) {
        logProcess($num, $msghdr->date);
        if(defined('_READONLY') &&  _READONLY === false) {
            if(defined('_MSGDISPOSE') &&  _MSGDISPOSE === 'seen') {
                imap_setflag_full(_MAILBOX, imap_uid(_MAILBOX,$num), "\\Seen", ST_UID);
                echo rightnow('log') . " - num = {$num} marked as SEEN\n";
            } else { //      OR 
                if(defined('_MSGDISPOSE') &&  _MSGDISPOSE === 'delete') {
                    imap_delete(_MAILBOX,$num);
                    echo rightnow('log') . " - num = {$num} marked as DELETED\n";
                }
            }
        } 
        // TODO: delay, don't blast through the messages(?)
        // REALITY Check: For example, if there are 1000 messages
        // to read and there is a 30 second delay betweeh each
        // then it will take about 8 hours to read them all. But
        // if the delay was 5 seconds then it would take 1 to 
        // 2 hours.
        // NOTE: Under normal "operating conditions" we would 
        // only be reading 1 message at a time, as it is received.
        // Reading bulk is only happening because there are messages
        // to catch up on.
    }
}
// Is expungement enabled?
if((defined('_READONLY') && _READONLY === false) &&
   (defined('_EXPUNGE') && _EXPUNGE === true) &&
   (defined('_EXPWHERE') && _EXPWHERE === 'readend')) {
        imap_expunge(_MAILBOX);
}
?>