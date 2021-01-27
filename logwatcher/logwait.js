
module.exports = function init(wevts, pevts, log) {

    var path = require('path');
    var scriptName = path.basename(__filename);
    log(`${scriptName} - init`);

    const ldata = require('./logdata.js');
    ldata.init(pevts, log);

    // https://nodejs.org/docs/latest-v12.x/api/events.html#events_asynchronous_vs_synchronous

    wevts.on('FILE_CREATED', (watchit) => {
        setImmediate(() => {
            log(`${scriptName} - FILE_CREATED: ${watchit.filename} in ${watchit.path}`);
            ldata.process(watchit);
        });
    });

    wevts.on('FILE_DELETED', (watchit) => {
        setImmediate(() => {
            log(`${scriptName} - FILE_DELETED: ${watchit.filename} in ${watchit.path}`);
        });
    });
};
