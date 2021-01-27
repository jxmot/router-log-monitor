
module.exports = function init(_pevts, _log) {
    
    var pevts = _pevts;
    var log = _log;

    var path = require('path');
    var scriptName = path.basename(__filename);
    log(`${scriptName} - init`);

    // https://nodejs.org/docs/latest-v12.x/api/events.html#events_asynchronous_vs_synchronous
    pevts.on('LOG_PROCESSED', (wfile) => {
        setImmediate(() => {
            log(`${scriptName} - creating report, last processed file: ${wfile.path}${wfile.filename}`);
        });
    });
};
