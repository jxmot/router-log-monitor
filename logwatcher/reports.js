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
    var dbcfg = {};

    pevts.on('DB_OPEN', (_dbobj) => {
        if(_dbobj.state === true) {
            dbopen = true;
            dbobj  = _dbobj.db;
            dbcfg  = dbobj.getDBCcfg();
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

    pevts.on('LOG_PROCESSED', (wfile) => {
        log(`- last processed file: ${wfile.path}${wfile.filename}`);
    });

    pevts.on('LOG_DBSAVED', (wfile) => {
        log(`- log saved to database, saved ${wfile.linecount} log entries from ${wfile.path}${wfile.filename}`);
    });
});
