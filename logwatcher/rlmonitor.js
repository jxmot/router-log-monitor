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
var lopt = require('./runlogopt.js');
var logOut = new Log(lopt.file, lopt.extn, lopt.size);
var logenable = true;
// pass this function around to the other modules
function _log(payload) {
    if(logenable === true) logOut.writeTS(payload);
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
        log(`- ERROR : openDone() errObj = ${JSON.stringify(errObj)}`);
    } else {
        // do some database stuff
        log('- openDone() - success! ready for some database stuff');
    }
    procs_evts.emit('DB_OPEN', {state:dbopen,db:(dbopen === true ? database : errObj)});
};

var fopt = process.argv[2];

// can optionally read files instead of waiting for them to 
// be created. NOTE: this works best when processing a large 
// quantity of logs.
if((fopt !== undefined) && (fopt === 'readfiles')) {
    // read all new log files
    const reader = require('./logread.js')(watch_evts, procs_evts, _log);
} else {
    // Watch for new log files
    const watcher = require('./logwatch.js')(watch_evts, procs_evts, _log);
}
// Process the log files into the database
const procs = require('./logprocess.js')(watch_evts, procs_evts, _log);
// Generate static reports
const reports = require('./reports.js')(procs_evts, _log);

// handle database errors here, including when the server closes 
// the connection after a period of being "idle".
function onDatabaseError(err) {
    log(`- onDatabaseError() err = ${err}`);
    if(err.message.includes('The server closed the connection') === true) {
        procs_evts.emit('DB_CLOSED', {state:false,db:null});
        log(`- onDatabaseError() sent DB_CLOSED, reopening database...`);
        setTimeout(openDB,2500); 
    } else {
        console.log("*******************************\n");
        console.log(`onDatabaseError() err = ${err}`);
        console.log("*******************************\n");
        process.exit(1);
    }
};

// Open the database
// NOTE: MySQL will keep an inactive connection 
// open for only 8 hours. Then it will close it.
function openDB() {
    database.openDB(openDone, onDatabaseError);
};

openDB();
