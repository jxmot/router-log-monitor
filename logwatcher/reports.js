
module.exports = function init(_pevts, _log) {
    
    var pevts = _pevts;
    var log = _log;

    var path = require('path');
    var scriptName = path.basename(__filename);
    log(`${scriptName} - init`);

    pevts.on('LOG_PROCESSED', (wfile) => {
        log(`${scriptName} - creating report, last processed file: ${wfile.path}${wfile.filename}`);
    });
};
