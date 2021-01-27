
module.exports = function init(pevts, _log) {
    
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    }

    log(`- init`);

    // https://nodejs.org/docs/latest-v12.x/api/events.html#events_asynchronous_vs_synchronous
    pevts.on('LOG_PROCESSED', (wfile) => {
        setImmediate(() => {
            log(`- creating report, last processed file: ${wfile.path}${wfile.filename}`);
        });
    });
};
