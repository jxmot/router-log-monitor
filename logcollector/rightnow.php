<?php
/*
    Return a string with the date and time. The
    exact format can be chosen when calling. It
    is optional to pass a date/time string that
    is formatted as "2020-12-21T04:33:38+00:00"
    and it will be returned with the selected 
    format.

    Arguments: 
        $fmt = string, can be:
                'csv'  - for use in cells in CSV formatted files
                'log'  - for use in non-delimted text files
                'name' - for use as the first part of a file name
                'json' - for use in JSON formatted files
        $created = a date/time string to be used in place of the 
                   current date & time

    Returns:
        String, the date and time formatted as requested
*/
function rightnow($fmt, $created = null) {

    $format = 'Ymd-His-';

    if($created === null) { 
        $dt = new DateTime('now', new DateTimeZone(tzone()));
    } else {
        $dt = new DateTime($created);
    }

    switch($fmt) {
        case 'csv':
            $format = 'Y/m/d,H:i:s';
            break;

        case 'log':
            $format = 'Y/m/d @ H:i:s';
            break;

        case 'name':
            $format = 'Ymd-His-';
            break;

        case 'json':
            $format = '["Ymd","His"]';
            break;

        default:
            break;
    }
    return $dt->format($format);
}
// Tests, run this file from the command line:
// >php rightnow.php
//
// Uncomment below for testing
//echo rightnow('json')."\n";
//echo rightnow('csv')."\n";
//echo rightnow('log')."\n";
//echo rightnow('name')."\n";
//echo rightnow('blah')."\n";
?>