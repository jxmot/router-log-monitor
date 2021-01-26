
module.exports = (function()  {

    var path = require('path');
    var scriptName = path.basename(__filename);

    logdata = {
    };

    var log = null;
    var pevts = null;

    logdata.init = function(_pevts, _log) {
        pevts = _pevts;
        log = _log;
        log(`${scriptName} - init`);
    };

    logdata.process = function(wfile) {
        // parse the log data and write to database...
        log(`${scriptName} - log processed: ${wfile.path}${wfile.filename}`);

        // announce completion...
        pevts.emit('LOG_PROCESSED', wfile);
    };

    return logdata;
})();

