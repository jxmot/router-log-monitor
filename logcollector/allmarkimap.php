<?php
require_once './timezone.php';
require_once './rightnow.php';  // modified

// manages echo calls
$verbose = false;
// manages to avoid actions that alter things
$donothng = false;
// extra debug output when -x is used
$extraout = false;

function echoit($msg) {
global $verbose;
    if($verbose === true) echo $msg;
}

$shorto = 'x::X::v::d::u::D::s::';
//$shorto = 'x::v::d::u::';
$opts = getopt($shorto);

if(isset($opts['x'])) {
    $donothng = true;
}

if($donothng === true) {
    if(isset($opts['X'])) {
        $extraout = true;
    }
}

($extraout ? print_r($opts):true);

if(isset($opts['v'])) {
    $verbose = true;
}

$undel = false;
if(isset($opts['d'])) {
    $undel = true;
}

$dodel = false;
if(isset($opts['D'])) {
    if($undel) echoit(rightnow('log') . " - arg conflict, -D is ignored\n");
    else $dodel = true;
}

$unsee = false;
if(isset($opts['u'])) {
    $unsee = true;
}

$dosee = false;
if(isset($opts['s'])) {
    if($unsee) echoit(rightnow('log') . " - arg conflict, -s is ignored\n");
    else $dosee = true;
}

// "usage" will be shown if there are no args
if(($undel === false) && ($unsee === false) &&
   ($dodel === false) && ($dosee === false)) {
    echo file_get_contents('./allmarkimap.txt');
    exit(0);
} else echoit(rightnow('log') . " - verbose is on\n");

echoit(rightnow('log') . 
                " - doing".($donothng ? ' nothing':'').": ".
                ($undel ? 'unDELETE' : '')." ".($unsee ? 'unSEEN' : '').
                ($dodel ? 'DELETE' : '')." ".($dosee ? 'SEEN' : '')."\n");

($donothng && !$extraout ? exit(0):true);

// load the IMAP connection parameters
$accnt = json_decode(file_get_contents('./_imapaccnt.json'));
$imapsrv = "{$accnt->host}:{$accnt->port}/imap/ssl";
$mbox = "{{$imapsrv}}INBOX{$accnt->folder}";

echoit(rightnow('log')." - {$accnt->login}\n");
echoit(rightnow('log')." - {$imapsrv}\n");
echoit(rightnow('log')." - {$mbox}\n\n");

// open it up...
$mailbox = imap_open($mbox, $accnt->login, $accnt->pword);
// check for success...
if($mailbox === false) {
    echo rightnow('log') . " - Failed connection to server\n";
    exit(0);
}

define('_MAILBOX',$mailbox);

$mcount = imap_num_msg(_MAILBOX);
for($num = 1;$num <= $mcount; $num++) {
    $msghdr = imap_headerinfo(_MAILBOX,$num);
    /*
        Recent   - R if recent and seen, N if recent and not seen, ' ' if not recent.
        Unseen   - U if not seen AND not recent, ' ' if seen OR not seen and recent
        Flagged  - F if flagged, ' ' if not flagged
        Answered - A if answered, ' ' if unanswered
        Deleted  - D if deleted, ' ' if not deleted
        Draft    - X if draft, ' ' if not draft 
    */
    echoit(rightnow('log') . " - r = {$msghdr->Recent}  u = {$msghdr->Unseen}  f = {$msghdr->Flagged}\n");
    echoit(rightnow('log') . " - a = {$msghdr->Answered}  D = {$msghdr->Deleted}  d = {$msghdr->Draft}\n");

    if($extraout === true) {
        print_r(imap_headerinfo(_MAILBOX,$num));
        break;
    }

    // -d      all deleted messages, unmark for deletion
    if($undel === true) {
        if($msghdr->Deleted === 'D') {
            $ret = (!$donothng ? imap_undelete(_MAILBOX, $num):'nothing');
            echoit(rightnow('log') . " - undel {$ret}   {$num}\n\n");
        } 
        echoit(rightnow('log') . "------\n");
    }
    // -u      all seen messages, mark as unseen
    if($unsee === true) {
        if($msghdr->Unseen !== 'U') {
            $ret = (!$donothng ? imap_clearflag_full(_MAILBOX, imap_uid(_MAILBOX,$num), "\\Seen", ST_UID):'nothing');
            echoit(rightnow('log') . " - unsee {$ret}   {$num}\n\n");
        }
    }
    // -D      mark all messages as deleted
    if($dodel === true) {
        if($msghdr->Deleted !== 'D') {
            $ret = (!$donothng ? imap_delete(_MAILBOX, $num):'nothing');
            echoit(rightnow('log') . " - del {$ret}   {$num}\n");
        }
    }
    // -s      mark all messages as seen
    if($dosee === true) {
        if($msghdr->Unseen === 'U') {
            $ret = (!$donothng ? imap_setflag_full(_MAILBOX, imap_uid(_MAILBOX,$num), "\\Seen", ST_UID):'nothing');
            echoit(rightnow('log') . " - see {$ret}   {$num}\n\n");
        }
    }
}
// done, close the connection
imap_close(_MAILBOX);
echo rightnow('log') . " - complete, normal exit\n";
exit(0);

// The following calls do NOT work:
//
//        $ret = imap_clearflag_full(_MAILBOX, $num, '\\Delete');
//        $ret = imap_clearflag_full(_MAILBOX, $num, "\\Delete");
//        $ret = imap_clearflag_full(_MAILBOX, imap_uid(_MAILBOX,$num), '\\Delete', ST_UID);
//        $ret = imap_clearflag_full(_MAILBOX, imap_uid(_MAILBOX,$num), "\\Delete", ST_UID);
//
//        $ret = imap_clearflag_full(_MAILBOX, $num, "\\Seen");

?>