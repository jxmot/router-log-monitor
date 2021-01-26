
module.exports = function init(wevts, pevts, log) {

    var path = require('path');
    var scriptName = path.basename(__filename);
    log(`${scriptName} - init`);

    const ldata = require('./logdata.js');
    ldata.init(pevts, log);

    wevts.on('FILE_CREATED', (watchit) => {
        log(`${scriptName} - FILE_CREATED: ${watchit.filename} in ${watchit.path}`);
        ldata.process(watchit);
    });

    wevts.on('FILE_DELETED', (watchit) => {
        log(`${scriptName} - FILE_DELETED: ${watchit.filename} in ${watchit.path}`);
    });
};
