<?php

require_once('./getMsgNum.php');
require_once('./isLogMsg.php');
require_once('./logProcess.php');

if(!defined('_IMAPSRV') || !defined('_MAILBOX')) {
    echo rightnow('log') . " - msgmgr.php: not connected\n";
    exit(0);
}

// get rid of any messages that were marked for deletion
//imap_expunge(_MAILBOX);

$headers = imap_headers(_MAILBOX);
if ($headers === false) {
    echo rightnow('log') . " - msgmgr.php: Failed to list headers in mailbox\n";
    exit(0);
}

foreach($headers as $hdr) {
    $num = getMsgNum($hdr);
    if($num !== -1) {
        $msghdr = isLogMsg($num);
        if($msghdr !== false) {
            logProcess($num);
            imap_delete(_MAILBOX,$msgnum);
        }
    } else {
        echo rightnow('log') . " - msgmgr.php: getMsgNum() failed [{$hdr}]\n";
        exit(0);
    }
}
// get rid of any messages that were marked for deletion
//imap_expunge(_MAILBOX);
?>