<?php
/*
    isLogMsg.php - Contains the isLogMsg() function. It
    determines if the message is a log message.

    Returns:

        false = this is not a log message
        header = returns the IMAP message header, not
        the plain-text. This is an object with message
        details.
*/
define('_LOGSUBJ', 'NETGEAR R6400 Log');

function isLogMsg($msgnum, $rmv = false) {
$ret = false;
    // https://www.php.net/manual/en/function.imap-headerinfo.php
    $header = imap_headerinfo(_MAILBOX,$msgnum);
    if(($header->Deleted !== 'D') && ($header->Unseen === 'U')){
        if(strpos($header->subject, _LOGSUBJ) === false) {
            $ret = false;
            if($rmv === true) imap_delete(_MAILBOX,$msgnum);
        } else {
            $ret = $header;
        }
    }
    return $ret;
}
?>