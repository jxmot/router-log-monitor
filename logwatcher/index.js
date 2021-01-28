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
// pass this function around to the other modules
function log(payload) {
    logOut.writeTS(payload);
};

// start logging
log('*******************************************');
log(`${scriptName} - begin app init`);

// event error handlers, if handled here then they 
// won't crash the app
watch_evts.on('error', (err) => {
    log(`${scriptName} - watch_evts ERROR ${err}`);
});

procs_evts.on('error', (err) => {
    log(`${scriptName} - procs_evts ERROR ${err}`);
});

// Watch for new log files
const watcher = require('./logwatch.js')(watch_evts, log);
// Process the log files into the database
const procs = require('./logprocess.js')(watch_evts, procs_evts, log);
// Generate static reports
const reports = require('./reports.js')(procs_evts, log);
