<?php
/*
    getMsgNum.php - Contains the getMsgNum() function. It
    extracts the IMAP message number from the plain-text 
    header.

    Returns:

        -1 : did not find the message number
        >=0 : message number
*/
function getMsgNum($hdr) {
$msgnum = -1;
    // also checks for "U"nread
    if(preg_match("/[U].+[0-9]\)/", $hdr)) {
        $sp1 = preg_split("/\)/", $hdr);
        $sp2 = preg_split("/[A-Z]/", $sp1[0]);
        $msgnum = intval($sp2[1]);
    }
    return $msgnum;
}
?>