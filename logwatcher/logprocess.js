
module.exports = function init(wevts, pevts, log) {

    var path = require('path');
    var scriptName = path.basename(__filename);
    log(`${scriptName} - init`);

    const wait = require('./logwait.js');
    wait(wevts, pevts, log);
};
