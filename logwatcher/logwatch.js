'use strict';
/*
    logwatch.js - This is where a folder is watched,
    it looks for new files and when one is created it
    triggers the FILE_CREATED event. It will also 
    trigger the FILE_DELETED event when a file is 
    deleted.
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
    log(`watching for log files in ${opt.path}`);

    // needed for fs.watch(), fs.statSync(), and
    // fs.accessSync()
    var fs = require('fs');

    // hold the file name that is passed in the
    // watch event
    var watchit = {
        path: opt.path,
        filename: '',
        now: 0,
        copybad: opt.copybad,
        mintstamp: opt.mintstamp,
        delbad: opt.delbad
    };

    // contains watchit objects that are used for
    // synchronizing the file create and delete events.
    var wqueue = {};

    /*
        https://nodejs.org/docs/latest-v12.x/api/fs.html#fs_fs_watchfile_filename_options_listener

        TODO: look at options, set interval to longer?
    */
    var dirwatch = fs.watch(opt.path, (evtype, filename) => {
        // could be either 'rename' or 'change'. new file event and delete
        // also generally emit 'rename'
        if(!logmute) log(`dirwatch event: ${evtype} file: ${filename}`);

        // only used for debugging
        watchit.now = Date.now();

        // sequence:
        //  file created = rename -> change
        //  file deleted, touch(linux), copied(linux) = rename
        //  file copied(Win) = rename -> change -> change
        switch(evtype) {
            // an error occurred...
            case 'error':
                // anounce it...
                log(`dirwatch event: error ${filename}  ${wqueue.length}`);
                // cancel all timeouts
                wqueue.forEach((item, index) => {
                    clearTimeout(item.toid);
                });
                // clear the queue
                wqueue = {};
                break;

            // this is the first event type received when a 
            // file is created or deleted
            case 'rename':
                // log file names are: YYYYMMDD-HHMMSS-net.log
                if(filename.match(opt.nameregexp) !== null) {
                    // save some info in the queue...
                    watchit.filename = filename;
                    wqueue[filename] = JSON.parse(JSON.stringify(watchit));
                    // if the timer expires then the file was deleted.
                    wqueue[filename].toid = setTimeout(renTO, 500, filename);
                } else {
                    log(`dirwatch event: did not recognize: ${filename}`);
                }
                break;

            // this is the second event type received when a 
            // file is created or deleted.
            case 'change':
                // there can be a 'change' event with out a 
                // preceding 'rename'
                if(typeof wqueue[filename] !== 'undefined') {
                    // the file is in the queue, cancel the
                    // timeout.
                    clearTimeout(wqueue[filename].toid);
                    wqueue[filename].toid = null;
                    if(!logmute) log(`dirwatch event: stats on - ${wqueue[filename].path}${filename}`);
// TODO: try/catch ?
                    // let's verify this is a file creation event
                    // https://nodejs.org/docs/latest-v12.x/api/fs.html#fs_class_fs_stats
                    var stats = fs.statSync(`${wqueue[filename].path}${filename}`);
                    if(stats.isFile() === true) {
                        log(`dirwatch event: ${wqueue[filename].path}${filename} @ ${stats.size}b was created`);
                        wevts.emit('FILE_CREATED', 
                                   {
                                        path:wqueue[filename].path,
                                        filename:filename,
                                        size:stats.size,
                                        copybad:wqueue[filename].copybad,
                                        mintstamp:wqueue[filename].mintstamp,
                                        delbad:wqueue[filename].delbad
                                   });
                    } else {
                        if(!logmute) log(`dirwatch event: ${filename} is not a file`);
                    }
                    // remove this entry from the queue 
                    delete wqueue[filename];
                } else {
                    if(!logmute) log(`dirwatch event: undefined - wqueue[${filename}] evtype = ${evtype}`);
                }
                break;
        };
    });

    /*
        renTO() - rename time out handler
    */
    function renTO(fname) {
        if(typeof wqueue[fname] !== 'undefined') {
            try {
                fs.accessSync(`${wqueue[fname].path}${fname}`, fs.constants.F_OK);
            } catch(err) {
                if(err.code === 'ENOENT') {
                    if(!logmute) log(`renTO(): info - ${wqueue[fname].path}${fname} was deleted or moved`);
                    wevts.emit('FILE_DELETED', {path:wqueue[fname].path,filename:fname});
                }
            }
            delete wqueue[fname];
        } else {
            log(`renTO(): undefined - wqueue[${fname}]`);
        }
    };

    // recursively create a path
    function makePath(pathname) {
        const __dirname = path.resolve();
        // Remove leading directory markers, and remove ending /file-name.extension
        pathname = pathname.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, ''); 
        var mkpath = path.resolve(__dirname, pathname);
        fs.mkdirSync(mkpath, {recursive:true});
        return mkpath;
    };

    /*
        Wait for the LOG_DBSAVED saved event. And check the
        options for what to do with the file that was just
        processed and saved.
    */
    pevts.on('LOG_DBSAVED', (wfile) => {
        log(`LOG_DBSAVED ${wfile.filename} saved to database.`);
        if(opt.readdel === true) {
            fs.unlinkSync(opt.path+wfile.filename);
            log(`LOG_DBSAVED DELETED [${opt.path+wfile.filename}]`);
        } else {
            if(opt.readren === true) {
                fs.renameSync(opt.path+wfile.filename, opt.path+opt.renchar+wfile.filename);
                log(`LOG_DBSAVED RENAMED to [${opt.path+opt.renchar+wfile.filename}]`);
            } else {
                if(opt.readmov === true) {
                    var moveto = makePath(opt.path+opt.movpath)+path.sep;
                    fs.renameSync(opt.path+wfile.filename, moveto+wfile.filename);
                    log(`LOG_DBSAVED MOVED from [${opt.path+wfile.filename}] to [${moveto+wfile.filename}]`);
                } else {
                    log(`LOG_DBSAVED DONE file left alone [${opt.path+wfile.filename}]`);
                }
            }
        }
    });
});
