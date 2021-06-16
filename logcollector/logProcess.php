<?php
/*
    logProcess.php - This is where the message is read
    and parsed to create the output file.
*/
require_once './writefile.php'; // modified

function logProcess($mnum, $hdate = null) {
    $body = imap_body(_MAILBOX,$mnum);
    if($body === null) {
        echo rightnow('log') . " - logProcess.php: ain't got no body\n";
        exit(0);
    }
    $body = strip_tags(str_replace("\r\n","\n",$body));
    //echo rightnow('log') . "body = \n{$body}\n\n";
    $lines = explode("\n", $body);

    // Remove any unwanted blank lines from the end
    do {
        $lqty = count($lines);
        if($lqty <= 0) {
            $dopop = false;
        } else {
            if(strlen($lines[$lqty - 1]) < 5) {
                array_pop($lines);
                $dopop = true;
            } else {
                $dopop = false;
            }
        }
    } while($dopop === true);

    if($hdate !== null) {
        $filestamp = rightnow('name',$hdate,false);
        // it seems that not all log files will have 
        // the "email sent to" in the last line. only
        // remove the line if it contains that string.
        if(strpos($lines[count($lines) - 1], 'email sent to') !== false) {
            // remove the last line
            array_pop($lines);
        }
    } else {
        // read last line
        // [email sent to: someone@somewhere.net] Friday, Jan 22,2021 00:01:01
        $lastline = $lines[count($lines) - 1];
        // get the date/time from it 
        $splitline = preg_split("/\] /", $lastline);
        echo rightnow('log') . " - splitline = {$splitline[1]}\n";
        $senttime = $splitline[1];
        $filestamp = rightnow('name',$senttime,true);
        // remove the last line
        array_pop($lines);
    }

    // the log data is arranged new -> old, this 
    // would be the spot to reverse it to old -> new
    $neworder = array_reverse($lines);
    // save the file
    writefile(_OUTPATH."{$filestamp._OUTFILE}", implode("\n",array_filter($neworder)), 'w');
}
?>