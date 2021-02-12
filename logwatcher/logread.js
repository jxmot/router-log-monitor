/*
    logread.js - find all log files found in the specified
    path and notify the log processor that a file is ready 
    for parsing and writing into the database.
*/
module.exports = (function(wevts, pevts, _log) {

    // set up run-time logging
    const path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    };

    // some run-time log entries can be muted
    var logmute = true;
    log(`- init`);

    // configure the path to the watched folder
    const opt = require('./watchopt.js');
    log(`- reading all log files in ${opt.path}`);

    // for creating an object that describes the file 
    // to the processor.
    class ReadIt {
        path = '';                  // opt.path
        filename = '';
        now = 0;
        size = 0;
        movebad = false;            // opt.movebad
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
        var match = file.match(/\d{8}-\d{6}-net\.log/g);
        var isLog = (match === null ? false : true);
        return ((isLog) && (!fs.lstatSync(path.resolve(opt.path, file)).isDirectory()));
    });

    // sort the list, oldest - newest(by file name)
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
            log(`- log file ${fname} size is 0(zero), skipping file.`);
        } else {
            var readit = new ReadIt;
            readit.path = opt.path;
            readit.filename =  fname,
            readit.now = Date.now();
            readit.size = stats.size;
            readit.movebad = opt.movebad;
            readit.mintstamp = opt.mintstamp;
            readit.delbad = opt.delbad;
            fready.push(readit);
        }
    });

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
                log(`- log ${wfile.filename} saved to database, reading the next log...`);
                sendFC(Object.assign({}, fready[0]));
                fready.shift();
            } else {
                log(`- log ${wfile.filename} saved to database, no more files.`);
            }
        });
    };

    // do NOT start processing files until the necessary data 
    // table(s) are read from the database.
    pevts.once('DATA_READY',  (dbtable) => {
        // this event will tell us which table has been read
        if(dbtable.includes('actions') === true) {
            if(fready.length > 0) {
                // start with the first file in the list
                sendFC(Object.assign({}, fready[0]));
                // remove it from the queue
                fready.shift();
            }
        }
    });
});
