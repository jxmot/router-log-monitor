<?php
require_once './timezone.php';
require_once './rightnow.php';  // modified

$accnt = json_decode(file_get_contents('./_imapaccnt.json'));
$imapsrv = "{$accnt->host}:{$accnt->port}/imap/ssl";

$mailbox = imap_open("{{$imapsrv}}INBOX", $accnt->login, $accnt->pword,  OP_READONLY );
if($mailbox === false) {
    echo rightnow('log') . " - logcollector.php: Failed to connect to server\n";
    exit(0);
}

$msgqty = imap_num_msg($mailbox); 
if($msgqty === false) {
    echo rightnow('log') . " - logcollector.php: error calling imap_num_msg\n";
    exit(0);
} else if($msgqty === 0) {
    echo rightnow('log') . " - logcollector.php: no messages\n";
    exit(0);
}

define('_IMAPSRV',$imapsrv);
define('_MAILBOX',$mailbox);
define('_MSGQTY',$msgqty);

require_once './msgmgr.php';

imap_close(_MAILBOX);
echo rightnow('log') . " - logcollector.php: complete, normal exit\n";
exit(0);
?>