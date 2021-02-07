/*
    logwatch.js - This is where a folder is watched,
    it looks for new files and when one is created it
    triggers the FILE_CREATED event. It will also 
    trigger the FILE_DELETED event when a file is 
    deleted.
*/
module.exports = (function(wevts, _log) {
    // set up run-time logging
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    };

    var logmute = true;
    log(`- init`);

    // configure the path to the watched folder
    const opt = require('./watchopt.js');
    log(`- watching in ${opt.path}`);

    // needed for fs.watch(), fs.statSync(), and
    // fs.accessSync()
    var fs = require('fs');

    // hold the file name that is passed in the
    // watch event
    var watchit = {
        path: opt.path,
        filename: '',
        now: 0,
        movebad: opt.movebad,
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
                // save some info in the queue...
                watchit.filename = filename;
                wqueue[filename] = JSON.parse(JSON.stringify(watchit));
                // if the timer expires then the file was deleted.
                wqueue[filename].toid = setTimeout(renTO, 500, filename);
                break;

            // this is the second event type received when a 
            // file is created or deleted.
            case 'change':
                // there can be a 'change' event with out a 
                // preceding 'rename'
                if(wqueue[filename] !== undefined) {
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

// clear previous timeout, if any
// add to file obj queue
// add a timeout(5sec), on expiration emit FILEZ_CREATED with deref'd queue
//      alternative to:
                        wevts.emit('FILE_CREATED', 
                                   {
                                        path:wqueue[filename].path,
                                        filename:filename,
                                        size:stats.size,
                                        movebad:wqueue[filename].movebad,
                                        mintstamp:wqueue[filename].mintstamp,
                                        delbad:wqueue[filename].delbad
                                   });
                    } else {
                        if(!logmute) log(`dirwatch event: ${filename} is not a file`);
                    }
                    // remove this entry from the queue 
                    delete wqueue[filename];
                } else {
                    if(!logmute) log(`dirwatch event: secondary ${evtype} ${filename}`);
                }
                break;
        };
    });

    /*
        renTO() - rename time out handler
    */
    function renTO(fname) {
        if(wqueue[fname] !== undefined) {
            try {
                fs.accessSync(`${wqueue[fname].path}${fname}`, fs.constants.F_OK);
            } catch(err) {
                if(err.code === 'ENOENT') {
                    if(!logmute) log(`renTO(): ${wqueue[fname].path}${fname} was deleted`);
                    wevts.emit('FILE_DELETED', {path:wqueue[fname].path,filename:fname});
                }
            }
            delete wqueue[fname];
        } else {
            log(`renTO(): undefined - wqueue[${fname}]`);
        }
    };

    /*
        When "20210123-214242-net.log" is created with imaptest.php:
        
        rename
        20210123-214242-net.log
        change
        20210123-214242-net.log
        
        
        When that file is deleted:
        
        rename
        20210123-214242-net.log
    
    */
});
