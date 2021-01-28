/*
    logwait.js - wait for a file to be created and then
    process it for the database
*/
module.exports = function init(wevts, pevts, _log) {
    // set up run-time logging
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    }

    log(`- init`);

    const ldata = require('./logdata.js');
    ldata.init(pevts, log);

    /*
        wait for file create and delete events from 
        the watcher. 
        
        Using: 
        https://nodejs.org/docs/latest-v12.x/api/events.html#events_asynchronous_vs_synchronous
        
        More info(start here:
        https://nodejs.dev/learn/the-nodejs-event-loop
    */
    wevts.on('FILE_CREATED', (watchit) => {
        setImmediate(() => {
            log(`- FILE_CREATED: ${watchit.filename} in ${watchit.path}`);
            ldata.process(watchit);
        });
    });

    wevts.on('FILE_DELETED', (watchit) => {
        setImmediate(() => {
            log(`- FILE_DELETED: ${watchit.filename} in ${watchit.path}`);
        });
    });
};
