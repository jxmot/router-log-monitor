/*
    reports.js - waits for the LOG_PROCESSED event and 
    reads the database to generate static reports
*/
module.exports = (function(pevts, _log) {
    // set up run-time logging
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    }

    var dbopen = false;
    var dbobj = {};

    pevts.on('DB_OPEN', (_dbobj) => {
        if(_dbobj.state === true) {
            dbopen = true;
            dbobj = _dbobj.db;
            log(`- DB_OPEN: success`);
        } else {
            log(`- DB_OPEN: ERROR ${dbobj.db.err.message}`);
        }
    });

    pevts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
        dbobj = {};
    });

    log(`- init`);

    // https://nodejs.org/docs/latest-v12.x/api/events.html#events_asynchronous_vs_synchronous
    pevts.on('LOG_PROCESSED', (wfile) => {
        // run after any queued i/o
        setImmediate(() => {
            log(`- creating report, last processed file: ${wfile.path}${wfile.filename}`);
        });
    });
});
