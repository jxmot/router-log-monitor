<?php

// $msgnum = getMsgNum($headers[$head_idx])

function getMsgNum($hdr) {
$msgnum = -1;

    if(preg_match("/[U].+[0-9]\)/", $hdr)) {
        //$tmp = preg_split("/[ ].+[0-9]\)/", $headers[$head_idx]);
        $sp1 = preg_split("/\)/", $hdr);
        //    print_r($sp1);
        $sp2 = preg_split("/[A-Z]/", $sp1[0]);
    //    print_r($sp2);
        $msgnum = intval($sp2[1]);
    //    echo "\nmsg # = {$msgnum}\n\n\n";
    }
    return $msgnum;
}
?>