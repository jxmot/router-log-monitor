
module.exports = function init(wevts, pevts,  _log) {
    
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    }

    log(`- init`);

    const wait = require('./logwait.js');
    wait(wevts, pevts, log);
};
