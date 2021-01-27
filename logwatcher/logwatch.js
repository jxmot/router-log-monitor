
module.exports = function init(wevts, log) {

    var path = require('path');
    var scriptName = path.basename(__filename);
    log(`${scriptName} - init`);

    const opt = require('./watchopt.js');
    log(`${scriptName} - watching in ${opt.path}`);

    var fs = require('fs');

    var watchit = {
        path: opt.path,
//        rename: 0,
//        change: 0,
        filename: '',
        now: 0 
    };

//    var fqueue = {};
    var fqueue = [];

//    var toid;

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
                log(`${scriptName} dirwatch event: error ${filename}  ${fqueue.length}`);
                fqueue.forEach((item, index) => {
                    clearTimeout(item.toid);
                });
                fqueue = [];
//                watchit.filename = '';
//                watchit.rename = 0;
//                watchit.change = 0;
                break;

            case 'rename':
//                watchit.rename = watchit.now;
                watchit.filename = filename;
                fqueue[filename] = JSON.parse(JSON.stringify(watchit));
//                fqueue.push(JSON.parse(JSON.stringify(watchit)));
                fqueue[filename].toid = setTimeout(renTO, 1000, filename);
//                fqueue[(fqueue.length - 1)].toid = setTimeout(renTO, 1000, fqueue[(fqueue.length - 1)].filename, (fqueue.length - 1));
                break;

            case 'change':
                if(fqueue[filename] !== undefined) {
                    clearTimeout(fqueue[filename].toid);
                    fqueue[filename].toid = null;
                    log(`${scriptName} dirwatch event: stats on - ${fqueue[filename].path}${filename}`);
// /                watchit.change = watchit.now;
// /                if(watchit.rename !== 0) {
// /                    if((watchit.change - watchit.rename) < 1000) {
// ^
                        var stats = fs.statSync(`${fqueue[filename].path}${filename}`)
//                        var stats = fs.statSync(`${watchit.path}${watchit.filename}`)
                        if(stats.isFile() === true) {
                            log(`${scriptName} dirwatch event: ${fqueue[filename].path}${filename} was created`);
                            wevts.emit('FILE_CREATED', {path:fqueue[filename].path,filename:filename});
//                            log(`${scriptName} dirwatch event: ${watchit.path}${watchit.filename} was created`);
//                            wevts.emit('FILE_CREATED', {path:watchit.path,filename:watchit.filename});
                        } else {
                            log(`${scriptName} dirwatch event: ${filename} is not a file`);
//                            log(`${scriptName} dirwatch event: ${watchit.filename} is not a file`);
                        }
                        delete fqueue[filename];
//                      watchit.filename = '';
//                      watchit.rename = 0;
//                        watchit.change = 0;
//                    } else {
//                        watchit.change = 0;
//                    }
                } else {
//                    watchit.change = 0;
//                    watchit.filename = '';
                    log(`${scriptName} dirwatch event: secondary ${eventType} ${filename}`);
                }
                break;
        };
    });
//fqueue[fqidx]
    function renTO(fname) {
//    function renTO(fname,fqidx) {
        if(fqueue[fname] !== undefined) {
//        if(watchit.filename === fname) {
            try {
                fs.accessSync(`${fqueue[fname].path}${fname}`, fs.constants.F_OK);
//                fs.accessSync(`${watchit.path}${watchit.filename}`, fs.constants.F_OK);
            } catch(err) {
                if(err.code === 'ENOENT') {
                    log(`${scriptName} renTO(): ${fqueue[fname].path}${fname} was deleted`);
                    wevts.emit('FILE_DELETED', {path:fqueue[fname].path,filename:fname});
//                    log(`${scriptName} renTO(): ${watchit.path}${watchit.filename} was deleted`);
//                    wevts.emit('FILE_DELETED', {path:watchit.path,filename:fname});
                }
            }
            delete fqueue[fname];
       } else {
            log(`${scriptName} renTO(): in ${fqueue[fname].path} the file was not deleted, got ${fname}`);
//            log(`${scriptName} renTO(): in ${watchit.path} file ${watchit.filename} was not deleted, got ${fname}`);
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
