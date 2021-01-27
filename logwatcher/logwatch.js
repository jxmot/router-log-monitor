
module.exports = function init(wevts, _log) {
    
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    }

    log(`- init`);

    const opt = require('./watchopt.js');
    log(`- watching in ${opt.path}`);

    var fs = require('fs');

    var watchit = {
        path: opt.path,
        filename: '',
        now: 0 
    };

    var fqueue = {};

    /*
        https://nodejs.org/docs/latest-v12.x/api/fs.html#fs_fs_watchfile_filename_options_listener

        TODO: look at options, set interval to longer?
    */
    var dirwatch = fs.watch(opt.path, (eventType, filename) => {
        // could be either 'rename' or 'change'. new file event and delete
        // also generally emit 'rename'
        log(`dirwatch event: ${eventType} file: ${filename}`);

        watchit.now = Date.now();

        // sequence:
        //  file created = rename -> change
        //  file deleted, touch(linux), copied(linux) = rename
        //  file copied(Win) = rename -> change -> change

        // NOTE: 
    
        switch(eventType) {
            case 'error':
                log(`dirwatch event: error ${filename}  ${fqueue.length}`);
                fqueue.forEach((item, index) => {
                    clearTimeout(item.toid);
                });
                fqueue = [];
                break;

            case 'rename':
                watchit.filename = filename;
                fqueue[filename] = JSON.parse(JSON.stringify(watchit));
                fqueue[filename].toid = setTimeout(renTO, 500, filename);
                break;

            case 'change':
                if(fqueue[filename] !== undefined) {
                    clearTimeout(fqueue[filename].toid);
                    fqueue[filename].toid = null;
                    log(`dirwatch event: stats on - ${fqueue[filename].path}${filename}`);
                    var stats = fs.statSync(`${fqueue[filename].path}${filename}`)
                    if(stats.isFile() === true) {
                        log(`dirwatch event: ${fqueue[filename].path}${filename} was created`);
                        wevts.emit('FILE_CREATED', {path:fqueue[filename].path,filename:filename});
                    } else {
                        log(`dirwatch event: ${filename} is not a file`);
                    }
                    delete fqueue[filename];
                } else {
                    log(`dirwatch event: secondary ${eventType} ${filename}`);
                }
                break;
        };
    });

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
};
