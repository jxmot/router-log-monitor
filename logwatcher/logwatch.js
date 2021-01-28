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
        now: 0 
    };

    // contains watchit objects that are used for
    // synchronizing the file create and delete events.
    var fqueue = {};

    /*
        https://nodejs.org/docs/latest-v12.x/api/fs.html#fs_fs_watchfile_filename_options_listener

        TODO: look at options, set interval to longer?
    */
    var dirwatch = fs.watch(opt.path, (evtype, filename) => {
        // could be either 'rename' or 'change'. new file event and delete
        // also generally emit 'rename'
        log(`dirwatch event: ${evtype} file: ${filename}`);

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
                log(`dirwatch event: error ${filename}  ${fqueue.length}`);
                // cancel all timeouts
                fqueue.forEach((item, index) => {
                    clearTimeout(item.toid);
                });
                // clear the queue
                fqueue = {};
                break;

            // this is the first event type received when a 
            // file is created or deleted
            case 'rename':
                // save some info in the queue...
                watchit.filename = filename;
                fqueue[filename] = JSON.parse(JSON.stringify(watchit));
                // if the time expires then the file was deleted.
                fqueue[filename].toid = setTimeout(renTO, 500, filename);
                break;

            // this is the second event type received when a 
            // file is created or deleted.
            case 'change':
                // there can be a 'change' event with out a 
                // preceding 'rename'
                if(fqueue[filename] !== undefined) {
                    // the file is in the queue, cancel the
                    // timeout.
                    clearTimeout(fqueue[filename].toid);
                    fqueue[filename].toid = null;
                    log(`dirwatch event: stats on - ${fqueue[filename].path}${filename}`);
                    // let's verify this is a file creation event
                    var stats = fs.statSync(`${fqueue[filename].path}${filename}`)
                    if(stats.isFile() === true) {
                        log(`dirwatch event: ${fqueue[filename].path}${filename} was created`);
                        wevts.emit('FILE_CREATED', {path:fqueue[filename].path,filename:filename});
                    } else {
                        log(`dirwatch event: ${filename} is not a file`);
                    }
                    // remove this entry from the queue 
                    delete fqueue[filename];
                } else {
                    log(`dirwatch event: secondary ${evtype} ${filename}`);
                }
                break;
        };
    });

    /*
        renTO() - rename time out handler
    */
    function renTO(fname) {
        if(fqueue[fname] !== undefined) {
            try {
                fs.accessSync(`${fqueue[fname].path}${fname}`, fs.constants.F_OK);
            } catch(err) {
                if(err.code === 'ENOENT') {
                    log(`renTO(): ${fqueue[fname].path}${fname} was deleted`);
                    wevts.emit('FILE_DELETED', {path:fqueue[fname].path,filename:fname});
                }
            }
            delete fqueue[fname];
        } else {
            log(`renTO(): undefined - fqueue[${fname}]`);
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
