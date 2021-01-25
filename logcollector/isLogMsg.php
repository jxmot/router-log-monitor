<?php

define('_LOGSUBJ', 'NETGEAR R6400 Log');

function isLogMsg($msgnum) {
//$ret = false;

    // https://www.php.net/manual/en/function.imap-headerinfo.php
    // timestamp
    $header = imap_headerinfo(_MAILBOX,$msgnum);
    //echo "sent = {$header->MailDate}\n";
    //echo "date = {$header->date}\n\n\n";

    //echo "sent  = " . strtotime($header->MailDate) . "\n";
    //echo "date  = " . strtotime($header->date) . "\n";
    //echo "udate = {$header->udate}\n\n";

    //echo rightnow('name',$header->MailDate) . "\n\n\n";

    //echo "subject = {$header->subject}\n\n\n";

    if(strpos($header->subject, _LOGSUBJ) === false) {
        $ret = false;
        imap_delete(_MAILBOX,$msgnum);
    } else {
        $ret = $header;
    }
    return $ret;
?>