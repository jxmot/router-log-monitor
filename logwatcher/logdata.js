/*
    logdata.js - this is where the log file will be parsed
    and written to the detabase
*/
module.exports = (function(pevts, _log)  {
    
    logdata = {
    };

    // set up run-time logging
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    };

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

    logdata.process = function(wfile) {
        if(dbopen === false) {
            log(`- process(): database not open`);
        } else {
            // parse the log data and write to database...
            log(`- process(): ${wfile.path}${wfile.filename}`);
            // announce completion...
            pevts.emit('LOG_PROCESSED', wfile);
        }
        return dbopen;
    };

    return logdata;
});

