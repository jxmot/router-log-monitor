<?php
/*
    logProcess.php - This is where the message is read
    and parsed to create the output file.
*/
require_once './writefile.php'; // modified

function logProcess($mnum) {

    $body = imap_body(_MAILBOX,$mnum);
    if($body === null) {
        echo rightnow('log') . " - logProcess.php: ain't got no body\n";
        exit(0);
    }
//    echo "body = \n{$body}\n\n";

    // https://codingreflections.com/php-parse-html/
    $dom = new DomDocument();
    // need the @, otherwise PHP will complain
    @$dom->loadHTML($body);
    $allpre = $dom->getElementsByTagName('pre');

    // remove empty lines at the end of -
    // $allpre[0]->textContent
    $lines = explode("\n", $allpre[0]->textContent);
    //      loop this - 
    do {
        $lqty = count($lines);
        if(strlen($lines[$lqty - 1]) < 5) {
            array_pop($lines);
            $dopop = true;
        } else {
            $dopop = false;
        }
    } while($dopop === true);

    // read last line
    // [email sent to: someone@somewhere.net] Friday, Jan 22,2021 00:01:01
    $lastline = $lines[count($lines) - 1];
    // get the date/time from it 
    $splitline = preg_split("/\] /", $lastline);
    echo "splitline = {$splitline[1]}\n";
    //$senttime = "{$splitline[1]} -600";
    $senttime = $splitline[1];
    $filestamp = rightnow('name',$senttime,true);
    // remove the last line
    array_pop($lines);
    // 
    // the log data is arranged new -> old, this 
    // would be the spot to reverse it to old -> new
    $neworder = array_reverse($lines);
    // 
    // save the file
    writefile(_OUTPATH."{$filestamp}net.log", implode("\n",array_filter($neworder)), 'w');
}
?>