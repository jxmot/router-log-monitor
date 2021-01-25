<?php
/*
    Open a file, append to it, and close the file.
*/
function writefile($file, $line, $mode = 'a')
{
    $fileid = fopen($file,$mode);
    fwrite($fileid, $line);
    fflush($fileid);
    fclose($fileid);
}

/*
    Manage a log file, if the length exceeds $maxsize
    then it will be renamed(copied) to a timestamped
    file name. Then the orginal will be deleted.
*/
define('NO_FILE', 0);
define('GOOD_FILE', 1);
define('NEW_FILE', 2);

// file sizes
define('FILE_32K', 32768);
define('FILE_64K', FILE_32K * 2);
define('FILE_128K', FILE_64K * 2);
define('FILE_256K', FILE_128K * 2);

/*
    managefile() - Will limit the size of the log file. And
    can optionally callback to allow the caller to write an 
    ending into the log file. This is useful for files 
    formatted in JSON.

    Arguments: 
        $maxsize  = integer, maximum allowed size in bytes
        $filename = string, the name plus extension
        $path     = string, the location of the file
        $cb       = function, optional, calls this function
                    to write an ending into the file.

    Returns:

        NO_FILE   = the file does not exist
        GOOD_FILE = the file exists and is below the maximum size
        NEW_FILE  = the file was archived and the optional callback
                    was called, the new file may or may not exist

*/
function managefile($maxsize, $filename, $path, $cb = null)
{
    $fullfile = $path . $filename;

    if(file_exists($fullfile)) {
        // limit the size of a log file
        if(filesize($fullfile) > $maxsize) {
            // make a time stamped copy and delete the current file.
            $archfile = $path . rightnow('name') . $filename;
            copy($fullfile, $archfile);
            unlink($fullfile);
            // callback, allows chance to write any ending to the file
            if($cb !== null) $cb($archfile);
            return NEW_FILE;
        } else {
            if(filesize($fullfile) === 0) return NEW_FILE;
        }
        return GOOD_FILE;
    }
    return NO_FILE;
}
?>