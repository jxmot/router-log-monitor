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

    pevts.on('DB_OPEN', (dbobj) => {
        if(dbobj.state === true) {
            dbopen = true;
            dbobj = dbobj.db;
            log(`- DB_OPEN: success`);
        } else {
            log(`- DB_OPEN: ERROR ${dbobj.db.err.message}`);
        }
    });

    log(`- init`);

    // https://nodejs.org/docs/latest-v12.x/api/events.html#events_asynchronous_vs_synchronous
    pevts.on('LOG_PROCESSED', (wfile) => {
        setImmediate(() => {
            log(`- creating report, last processed file: ${wfile.path}${wfile.filename}`);
        });
    });
});
