/*
    logdata.js - this is where the log file will be parsed
    and written to the detabase
*/
module.exports = (function(_pevts, _log)  {
    
    var log_ = null;
    var pevts = null;

    logdata = {
    };

    pevts = _pevts;

    // set up run-time logging
    log_ = _log;
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        log_(`${scriptName} ${payload}`);
    };

    log(`- init`);

    logdata.process = function(wfile) {
        // parse the log data and write to database...
        log(`- log processed: ${wfile.path}${wfile.filename}`);
        // announce completion...
        pevts.emit('LOG_PROCESSED', wfile);
    };

    return logdata;
});

