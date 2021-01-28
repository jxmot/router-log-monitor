/*
    logprocess.js - this is where files are 
    processed into database records.
*/
module.exports = (function(wevts, pevts,  _log) {
    // set up run-time logging
    var path = require('path');
    var scriptName = path.basename(__filename);

    function log(payload) {
        _log(`${scriptName} ${payload}`);
    }

    log(`- init`);

    const wait = require('./logwait.js')(wevts, pevts, _log);
});
