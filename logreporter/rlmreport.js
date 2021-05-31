'use strict';
/* ************************************************************************ */
// https://nodejs.org/docs/latest-v12.x/api/documentation.html
const path = require('path');
const scriptName = path.basename(__filename);

// // Events
// const EventEmitter = require('events');
// // log "watcher" events
// const watch_evts = new EventEmitter();
// // app "process" events
// const procs_evts = new EventEmitter();

// Run-Time Logging
const Log = require('simple-text-log');
const logOut = new Log(require('./runlogopt.js'));
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




/*
    Database Interface Configure and other necessary things.
*/
const database = require('./mysql/database-mysql.js')(_log);

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

openDB();

