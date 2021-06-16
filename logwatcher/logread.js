'use strict';
/*
    logread.js - Find all log files in the specified
    path and create a sorted list. Then notify the log 
    processor that a file is ready for parsing and 
    writing into the database.

    Unlike the log watcher this will run once and stop.

    The following behavior is configurable:
        * on completion delete or rename all log files, or not
        * on completion exit the app, or not

*/
module.exports = (function(wevts, pevts, _log) {
    // set up run-time logging
    const path = require('path');
    const scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} - ${payload}`);
    };

    // some run-time log messages can be muted
    const logmute = true;
    log(`init`);

    // configure the path to the watched folder
    const opt = require('./watchopt.js');
    log(`reading all log files in ${opt.path}`);

    function makePath(pathname) {
        const __dirname = path.resolve();
        // Remove leading directory markers, and remove ending /file-name.extension
        pathname = pathname.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, ''); 
        var mkpath = path.resolve(__dirname, pathname);
        fs.mkdirSync(mkpath, {recursive:true});
        return mkpath;
    };

    // for creating an object that describes the file 
    // to the processor.
    class ReadIt {
        path = '';                  // opt.path
        filename = '';
        now = 0;
        size = 0;
        copybad = false;            // opt.copybad
        mintstamp = 0;              // opt.mintstamp
        delbad = false;             // opt.delbad
    };

    // needed for fs.readdirSync(), fs.lstatSync(), and
    // fs.statSync()
    const fs = require('fs');

    // get a list of all files in the path
    var tmp = fs.readdirSync(opt.path);
    var flist = [];
    // filter the list, only contains log files
    flist = tmp.filter((file, idx) => {
        // log file names are: YYYYMMDD-HHMMSS-net.log
        var match = file.match(opt.nameregexp);
        var isLog = (match === null ? false : true);
        return ((isLog) && (!fs.lstatSync(path.resolve(opt.path, file)).isDirectory()));
    });

    // sort the list, oldest -> newest(by file name)
    var fsort = [];
    if(flist.length > 1 ) {
        fsort = flist.sort((a, b) => {
            return a < b;
        });
    }

    // create an array of objects that describe the log file,
    // skip any files with 0 length.
    var fready = [];
    fsort.forEach((fname, idx) => {
        let stats = fs.statSync(opt.path+fname);
        if(stats.size === 0) {
            log(`log file ${fname} size is 0(zero), skipping file.`);
        } else {
            var readit = new ReadIt;
            readit.path = opt.path;
            readit.filename = fname,
            readit.now = Date.now();
            readit.size = stats.size;
            readit.copybad = opt.copybad;
            readit.mintstamp = opt.mintstamp;
            readit.delbad = opt.delbad;
            fready.push(readit);
        }
    });

    // called when there are no more log files to read
    function readEnd() {
        // check the options to see what we'll do with
        // the file now that we're done with it...
        if(opt.readdel === true) {
            // delete all files
            fsort.forEach((file, idx) => {
                fs.unlinkSync(opt.path+file);
            });
            log(`readEnd(): DELETED all log files.`);
        } else {
            if(opt.readren === true) {
                // rename all files
                fsort.forEach((file, idx) => {
                    fs.renameSync(opt.path+file, opt.path+opt.renchar+file);
                });
                log(`readEnd(): renamed all log files, prepended with [${opt.renchar}].`);
            } else {
                if(opt.readmov === true) {
                    // move all files
                    var moveto = makePath(opt.path+opt.movpath)+path.sep;
                    fsort.forEach((file, idx) => {
                        fs.renameSync(opt.path+file, moveto+file);
                    });
                    log(`readEnd(): moved all log files to ${moveto}.`);
                }
            }
        }
        // all done! exit?
        if(opt.readexit === true) {
            log(`readEnd(): exiting now...`);
            process.exit(0);
        }
    };

    // send the file object to the processor
    // via a timeout.
    function sendFC(frobj) {
        setTimeout(fcemit, 100, frobj);
    };

    // called only from the setTimeout() above,
    // it will emit the FILE_CREATED event which 
    // will trigger processing. then it will wait 
    // for the LOG_DBSAVED event, when it's received 
    // the next file will be processed.
    function fcemit(frobj) {
        wevts.emit('FILE_CREATED', frobj);
        pevts.once('LOG_DBSAVED', (wfile) => {
            if(fready.length > 0) {
                log(`fcemit(): LOG_DBSAVED ${wfile.filename} saved to database, reading the next log...`);
                sendFC(Object.assign({}, fready[0]));
                fready.shift();
            } else {
                log(`fcemit(): LOG_DBSAVED ${wfile.filename} saved to database, no more files.`);
                // decouple the bulk handling of files 
                // from this event handller
                setTimeout(readEnd, 100);
            }
        });
    };

    // do NOT start processing files until the necessary data 
    // table(s) are read from the database. only handle this
    // event one time, it's only needed to start things going.
    pevts.once('STATICDATA_READY', () => {
        if(fready.length > 0) {
            log(`STATICDATA_READY start log processing, ${fready.length} files to go`);
            // start with the first file in the list
            sendFC(Object.assign({}, fready[0]));
            // remove it from the queue
            fready.shift();
        }
    });
});
