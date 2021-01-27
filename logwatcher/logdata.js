
module.exports = (function()  {

    var path = require('path');
    var scriptName = path.basename(__filename);

    logdata = {
    };

    var log_ = null;
    var pevts = null;

    function log(payload) {
        log_(`${scriptName} ${payload}`);
    };

    logdata.init = function(_pevts, _log) {
        pevts = _pevts;
        log_ = _log;
        log(`- init`);
    };

    logdata.process = function(wfile) {
        // parse the log data and write to database...
        log(`- log processed: ${wfile.path}${wfile.filename}`);
        // announce completion...
        pevts.emit('LOG_PROCESSED', wfile);
    };

    return logdata;
})();

