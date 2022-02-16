'use strict';
/* 
    Router Log Monitor - Log Watcher

    Reads the log files created by logcollector and 
    parses the entrie and writes the results to a 
    database.


*/
var path = require('path');
var scriptName = path.basename(__filename);

// Events
const EventEmitter = require('events');
// log "watcher" events
const watch_evts = new EventEmitter();
// app "process" events
const procs_evts = new EventEmitter();

// Run-Time Logging
var Log = require('simple-text-log');
var logOut = new Log(require('./runlogopt.js'));
var logenable = true;
// pass this function around to the other modules
function _log(payload) {
    if(logenable === true) logOut.writeTS(payload);
};

var logmute = true;
function log(payload) {
    _log(`${scriptName} - ${payload}`);
};

// start logging
log('*******************************************');
log(`begin app init`);

/* ****************************************************
*/
// event error handlers, if handled here then they 
// won't crash the app
watch_evts.on('error', (err) => {
    log(`watch_evts ERROR ${err}`);
});

procs_evts.on('error', (err) => {
    log(`procs_evts ERROR ${err}`);
});

/* ****************************************************
    Database Interface Configure and other necessary 
    things.
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
        log(`openDone() - ERROR : errObj = ${JSON.stringify(errObj)}`);
    } else {
        // do some database stuff
        log('openDone() - success! ready for some database stuff');
    }
    procs_evts.emit('DB_OPEN', {state:dbopen,db:(dbopen === true ? database : errObj)});
};

// handle database errors here, including when the server closes 
// the connection after a period of being "idle".
function onDatabaseError(err) {
    log(`onDatabaseError() err = ${err}`);
    if(err.message.includes('The server closed the connection') === true) {
        procs_evts.emit('DB_CLOSED', {state:false,db:null});
        log(`onDatabaseError() sent DB_CLOSED, reopening database...`);
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

/* ****************************************************
    Command line arguments:

        read =  Read the log files and process them, 
                when finished exit.
        watch = Read log files after they're created 
                and process them, when finished continue 
                waiting for more (this is the default)
*/
var fopt = process.argv[2];
//var fopt = 'watch';
//var fopt = 'read';

log(`running in mode: ${(!fopt ? 'watch' : fopt)}`);

if(typeof fopt !== 'undefined') {
    switch(fopt) {
        case 'read':
            const reader = require('./logread.js')(watch_evts, procs_evts, _log);
            break;

        case 'watch':
            const watcher = require('./logwatch.js')(watch_evts, procs_evts, _log);
            break;

        default:
            log(`ERROR unknown operation ${fopt}`);
            process.exit(0);
            break;
    };
} else {
    const watcher = require('./logwatch.js')(watch_evts, procs_evts, _log);
}

/* ****************************************************
    The "app" object, it contains anything that we 
    need to pass on to a module. 
*/
var app = {
    constants: require('./constants.js'),
    staticdata: require('./staticdata.js')(procs_evts, _log),
    _log: _log,
    pevts: procs_evts
}

/* ****************************************************
    Process the log files into the database
*/
// the log processor
const ldata = require('./logdata.js')(app);

// wait for the log file created event...
watch_evts.on('FILE_CREATED', (watchit) => {
    if(!logmute) log(`FILE_CREATED: ${watchit.filename} in ${watchit.path}`);
    ldata.process(JSON.parse(JSON.stringify(watchit)));
});

// file deleted...
watch_evts.on('FILE_DELETED', (watchit) => {
    if(!logmute) log(`FILE_DELETED: ${watchit.filename} in ${watchit.path}`);
});

// Generate report tables in the database...
const reports = require('./reports.js')(app);

// open the database, if successful other modules will 
// be notified with an event
openDB();
