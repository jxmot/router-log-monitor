
module.exports = function init(wevts, log) {

    var path = require('path');
    var scriptName = path.basename(__filename);
    log(`${scriptName} - init`);

    const opt = require('./watchopt.js');
    log(`${scriptName} - watching in ${opt.path}`);

    var fs = require('fs');

    var watchit = {
        path: opt.path,
        rename: 0,
        change: 0,
        filename: '',
        now: 0 
    };

    var toid;

    /*
        https://nodejs.org/docs/latest-v12.x/api/fs.html#fs_fs_watchfile_filename_options_listener

        TODO: look at options, set interval to longer?
    */
    var dirwatch = fs.watch(opt.path, (eventType, filename) => {
        // could be either 'rename' or 'change'. new file event and delete
        // also generally emit 'rename'
        log(`${scriptName} dirwatch event: ${eventType} file: ${filename}`);

        watchit.now = Date.now();

        // sequence:
        //  file created = rename -> change
        //  file deleted, touch(linux), copied(linux) = rename
        //  file copied(Win) = rename -> change -> change

        // NOTE: 
    
        switch(eventType) {
            case 'error':
                clearTimeout(toid);
                watchit.filename = filename;
                break;

            case 'rename':
                watchit.rename = watchit.now;
                watchit.filename = filename;
                toid = setTimeout(renTO, 500, filename);
                break;

            case 'change':
                if(watchit.rename !== 0) {
                    watchit.change = watchit.now;
                    clearTimeout(toid);
                    fs.stat(`${opt.path}${watchit.filename}`, (err, stats) => {
                        if(stats.isFile() === true) {
                            log(`${scriptName} dirwatch event: ${watchit.filename} was created`);
                            wevts.emit('FILE_CREATED', JSON.parse(JSON.stringify(watchit)));
                        } else {
                            log(`${scriptName} dirwatch event: ${watchit.filename} is not a file`);
                        }
                        watchit.filename = '';
                        watchit.rename = 0;
                        watchit.change = 0;
                    });
                } else {
                    watchit.change = 0;
                    watchit.filename = '';
                    log(`${scriptName} dirwatch event: secondary ${eventType} received`);
                }
                break;
        };
    });

    function renTO(fname) {
        if(watchit.filename === fname) {
            fs.access(`${opt.path}${watchit.filename}`, fs.constants.F_OK, (err) => {
                if(err.code === 'ENOENT') {
                    log(`${scriptName} renTO(): ${opt.path}${watchit.filename} was deleted`);
                    wevts.emit('FILE_DELETED', JSON.parse(JSON.stringify(watchit)));
                    watchit.filename = '';
                    watchit.rename = 0;
                    watchit.change = 0;
                }
            });
        } else {
            log(`${scriptName} renTO(): in ${opt.path} file ${watchit.filename} was not deleted, got ${fname}`);
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
