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
function _log(payload) {
    logOut.writeTS(payload);
};

function log(payload) {
    _log(`${scriptName} ${payload}`);
}

// start logging
log('*******************************************');
log(`- begin app init`);

// event error handlers, if handled here then they 
// won't crash the app
watch_evts.on('error', (err) => {
    log(`- watch_evts ERROR ${err}`);
});

procs_evts.on('error', (err) => {
    log(`- procs_evts ERROR ${err}`);
});

/*
    Database Interface Configure and other necessary things.
*/
var database = require('./mysql/database-mysql.js')(_log);

// When the database is opened continue with
// the rest of the application
database.openDB(openDone);

// "database is open" handler
/*

        errObj = {
            parms: dbcfg.parms,
            err: {
                message: error.message,
                code: error.code,
                errno: error.errno
            }
        };
*/
function openDone(dbopen, errObj) {
    // did we have success?
    if(dbopen === false) {
        // no, log errors and end the transaction
        log('ERROR : openDone() errObj = ');
        log(JSON.stringify(errObj));
    } else {
        // do some database stuff
        log('openDone() - success! ready for some database stuff');
    }
    procs_evts.emit('DB_OPEN', {state:dbopen,db:(dbopen === true ? database : errObj)});
};

// Watch for new log files
const watcher = require('./logwatch.js')(watch_evts, _log);
// Process the log files into the database
const procs = require('./logprocess.js')(watch_evts, procs_evts, _log);
// Generate static reports
const reports = require('./reports.js')(procs_evts, _log);
