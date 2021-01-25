<?php
/*
    msgmgr.php - manages the reading of the email log
    messages.
*/
require_once('./getMsgNum.php');
require_once('./isLogMsg.php');
require_once('./logProcess.php');
// safety check, make sure we are connected
if(!defined('_IMAPSRV') || !defined('_MAILBOX')) {
    echo rightnow('log') . " - msgmgr.php: not connected\n";
    exit(0);
}

// TODO: investigate(trial-n-error) where the expunge
// should be done
// get rid of any messages that were marked for deletion
//imap_expunge(_MAILBOX);

// retrieve an array of plain-text message headers, the look
// like this - 
//      U       1)23-Jan-2021 Jim                  NETGEAR R6400 Log [C6:C0: (24621 chars)
$headers = imap_headers(_MAILBOX);
if ($headers === false) {
    echo rightnow('log') . " - msgmgr.php: Failed to list headers in mailbox\n";
    exit(0);
}
// iterate through the headers, and obtain the message 
// number, detect if it's a message we want, and if it
// is then read the message and create a file from it.
foreach($headers as $hdr) {
    $num = getMsgNum($hdr);
    echo "num = {$num}\n";
    if($num !== -1) {
        $msghdr = isLogMsg($num);
        if($msghdr !== false) {
            logProcess($num);
            // TODO: investigate if this is were this should be done
            //imap_delete(_MAILBOX,$msgnum);
        }
    } else {
        echo rightnow('log') . " - msgmgr.php: getMsgNum() failed [{$hdr}]\n";
        exit(0);
    }
}
// TODO: investigate(trial-n-error) where the expunge
// should be done
// get rid of any messages that were marked for deletion
//imap_expunge(_MAILBOX);
?>