/* ************************************************************************ */
// https://nodejs.org/docs/latest-v12.x/api/documentation.html

var path = require('path');
var scriptName = path.basename(__filename);

// Events
const EventEmitter = require('events');
const watch_evts = new EventEmitter();
const procs_evts = new EventEmitter();

// Run-Time Logging
var Log = require('./utils/Log.js');
var logOut = new Log('logs/watcher', 'log', 262144);

function log(payload) {
    logOut.writeTS(payload);
};

log('*******************************************');
log(`${scriptName} - begin app init`);

watch_evts.on('error', (err) => {
    log(`${scriptName} - watch_evts ERROR ${err}`);
});

procs_evts.on('error', (err) => {
    log(`${scriptName} - procs_evts ERROR ${err}`);
});

const watcher = require('./logwatch.js');
watcher(watch_evts, log);

const procs = require('./logprocess.js');
procs(watch_evts, procs_evts, log);

const reports = require('./reports.js');
reports(procs_evts, log);
