/* ************************************************************************ */
/*
    Log Object - Appends text to a file, that was specified when the object 
        was created. The file that is created will have a time stamp within
        its name.

        The file name will contain a time stamp formatted as - 

            YYYYMMDD-HHmmss

        If the caller supplies a base file name it will be prepended to the
        time stamp, for example if the base name is "data" the resulting name
        will be - 

            data-YYYYMMDD-HHmmss

        If the caller does NOT supply a base name the file name will only 
        contain the time stamp.

        Supplying a file extension when the object is created is optional.

        The default is ".txt" and will be used if the extension argument is 
        omitted.

    Usage:

        // Use the default extension - ".txt"
        // The file will be named - "logtest-20161215-113132.txt"
        var logTest = new Log('logtest');

        // The file will be named - "logtest-20161215-113132.log"
        var logTest = new Log('logtest', 'log');

        // The file will be named - "20161215-113132.txt"
        var logTest = new Log('');

        // The file will be named - "20161215-113132.log"
        var logTest = new Log('', 'log');

        NOTE: The extension can optionally contain a ".", if not part of the 
        extension argument it will be added automatically. It is also possible
        to create a file without any extension - 

        // time stamped name, and no extension - "20161215-113132"
        var logTest = new Log('', '');

        // use any file name desired (within reason of course!) -
        var logTest = new Log(true, 'myfilename.ext');


        // write some text to the file that was specified when the object 
        // was created
        logTest.write('this is some text');

        // write an empty line to the file
        logTest.write(''); 

            - OR - 

        logTest.write();


        NOTE: Separate clients can write(i.e. append) to the same file 
        as long as they're using the same file name. Here's how it can 
        be done - 

        // The file will be named - "logtest-20161215-113132.txt"
        var logTest = new Log('logtest');

        var logFileInUse = logTest.write('this is some text');
        // logFileInUse === 'logtest-20161215-113132.txt'

        // The logFileInUse variable can then be supplied to other clients
        // when they construct their Log object - 

        var otherLog = new Log(true, logFileInUse);

        // If the file name is saved externally to the client application it
        // could be recalled on the next application start and reused.

    (c) 2017 Jim Motyl - https://github.com/jxmot/node-dht-udp
*/
/*
    Log Object Constructor

    As noted above, the arguments are dual-function. For example,

        baseFileName - typically a string, but if 'true' (a boolean)
        then it indicates that fileExt contains a file name to be
        used for logging.
*/
function Log(baseFileName, fileExt, maxsize) {
    /*
        "Requires" needed for this module...


        For writing to the log file
    */
    var fs = require('fs');
    /*
        we're going to put a time stamp into the log file name
        https://www.npmjs.com/package/time-stamp
    */
    var tstamp = require('time-stamp');
    /*
        use the string module - https://www.npmjs.com/package/string
        documentation - http://stringjs.com/
        NOTE: Found some odd behavior using the length property. I had
        hoped it worked because it seemed to understand when a string
        was undefined and it would return a usable value.
    */
    var string  = require('string');
    /*
        Return a string containing a time stamp.

        Usage:
            var stamp;
            // returns - 20161215-144210
            stamp = Log.timeStamp(true);
            stamp = Log.timeStamp(true, false);

            // returns - 20161215-144210.075
            stamp = Log.timeStamp(true, true);

            // returns - 20161215-1442
            stamp = Log.timeStamp();
            stamp = Log.timeStamp(false);
            stamp = Log.timeStamp(false, true);

        NOTE: Originally I had tried locating this function at the bottom of
        this class. But I kept getting "timeStamp is not a function" when it 
        was called from any line above it. I'm sure there must be a practical
        way to eliminate the error, I just haven't learned about it yet.

        The "string" library is a bit out of date and comes with a issue. It's 
        a "Regular Expression Denial of Service". The advisory explains it
        here - https://npmjs.com/advisories/536

        Since it's not being used for any user input then it wont' be a high
        priority to replace it.
    */
    function timeStamp(useSeconds, useMSeconds) {
        var ts = tstamp('YYYY') + tstamp('MM') + tstamp('DD') + '-' + tstamp('HH')+ tstamp('mm');
        // use seconds?
        if(useSeconds === true) {
            ts = ts + tstamp('ss');
            // use milliseconds?
            if(useMSeconds === true) {
                ts = ts + '.' + tstamp('ms');
            }
        }
        return ts;
    };

    /*
        Clean up the text...

            Takes the source text and replaces several issue-prone
            characters or sequences with readable ones.
    */
    function cleanText(src) {
        var a = string(src).replaceAll('“', '"').s;
        var b = string(a).replaceAll('”', '"').s;
        var c = string(b).replaceAll('’', '\'').s;
        var d = string(c).replaceAll('&amp;', '&').s;
        return d;
    };

    // save for access in manageFile();
    var _maxsize = maxsize;
    // manage the file length...
    function manageFile(file) {
        var stats = fs.statSync(file);
        if(stats.size > _maxsize) {
            // find the '.' just before the extension
            // in the log file name
            var pos = -1;
            var found = false;
            while(!found) {
                pos = file.indexOf('.', pos+1);
                if(pos > 0) found = true;
            }
            // it's been found, now create a new time-stamped file name
            var archive = [file.slice(0, pos), '-'+timeStamp(true, false), file.slice(pos)].join('');
            // rename the old file to its archive name (time stamped)
            fs.renameSync(file, archive);
        }
    };

    /*
        Constructor Run-Time Code
    */
    this.ready   = false;
    this.file    = './';
    this.extn    = '';
    this.defextn = '.txt';

    // is there a base file name?
    if(baseFileName !== undefined) {
        if((typeof baseFileName === 'boolean') && (baseFileName === true) && (fileExt !== undefined)) {
            this.file = fileExt;
            // indicates to .write() that there's a valid file name to use
            this.ready = true;
        } else {
            this.file = this.file + baseFileName;
            // is there an extension?
            if(fileExt === undefined) {
                // no, use the default
                this.extn = this.defextn;
            } else {
                // yes, something is there. add a "." if the caller
                // didn't put it in the desired extension.
                if(string(fileExt).contains('.') === true) {
                    this.extn = fileExt;
                } else {
                    if(fileExt.length > 0) {
                        this.extn = '.' + fileExt;
                    } else this.extn = this.defextn;
                }
            }
            // finish the name + extension
            this.file  = this.file + this.extn;
            // indicates to .write() that there's a valid file name to use
            this.ready = true;
        }
    }
    /* Constructor Run-Time Code End */

    /*
        Write text to the log file and return the name of
        the file that was appended to.
    */
    this.write = function(text) {
        var textOut = '';
        // is the file name valid and ready for use?
        if(this.ready === true) {
            // yes, did the caller pass us any text?
            if(text !== undefined) {
                if(typeof text !== 'string') text = JSON.stringify(text);
                if(text.length > 0) {
                    // yes, did the caller put a newline at the end of the text?
                    if(text.charAt(text.length - 1) !== '\n') {
                        // nope, add a newline
                        textOut = text+'\n';
                    } else {
                        textOut = text;
                    }
                } else {
                    textOut = '\n';
                }
            } else {
                textOut = '\n';
            }
            // clean up the messy quotes
            var textClean = cleanText(textOut);
            // append the text to the log file,create it 
            // if necessary and check for errors
            fs.appendFileSync(this.file, textClean, {encoding: 'utf8'});
            // check the log file length, if too long then copy
            // it to a new name (time stamped) and truncate it.
            if(fs.existsSync(this.file)) manageFile(this.file);
        }
        return this.file;
    };

    /*
        Write text to the log file and return the name of
        the file that was appended to.
    */
    this.writeTS = function(text) {
        var lineTS = '['+timeStamp(true,true)+']: ';
        // append the text to the log file,create it 
        // if necessary and check for errors
        fs.appendFileSync(this.file, lineTS, {encoding: 'utf8'});
        return this.write(text);
    };
}

module.exports = Log;

