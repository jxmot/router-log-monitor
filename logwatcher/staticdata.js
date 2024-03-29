'use strict';
/*
    Static (or nearly static) Data

    This module manages static data used when parsing log 
    files. Data is read from static tables in the database
    after the DB_OPEN event is received.

    A pseudo-static table of MAC vendors is also managed 
    here. The read and write functions are used in report.js
    
*/
module.exports = (function(pevts, _log)  {
    // NOTE: property names are identical matches to 
    // the table names in our database 
    var staticdata = {
        actions: [],
        actioncats: [],
        ipcats: [],
        known: [],
        attacktypes: [],
        macvendors: [],
        // the state of the associated table, 
        // false = not read, true = ready to use
        dbstates: {
            actions: false,
            actioncats: false,
            ipcats: false,
            known: false,
            attacktypes: false,
            macvendors: false
        }
    };

    // set up run-time logging
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} - ${payload}`);
    };

    var logmute = true;
    log(`init`);

    /* ****************************************************
        This module uses the database. We will keep 
        track of the database state (open or closed) 
        and react to the state change.
    */
    // database variables
    var dbopen = false;
    var dbobj = {};
    var dbcfg = {};

    // when the database is open and ready read the 
    // static data tables...
    pevts.on('DB_OPEN', (_dbobj) => {
        if(_dbobj.state === true) {
            dbopen = true;
            dbobj = _dbobj.db;
            log(`DB_OPEN: success`);
            dbcfg = dbobj.getDBCcfg();
            // get the data...
            readAll();
        } else {
            log(`DB_OPEN: ERROR ${_dbobj.db.err.message}`);
        }
    });

    // database has been closed, change state and clear 
    // objects and data...
    pevts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
        dbobj = {};
        clearTables();
    });

    /* ****************************************************
        Private Functions - for reading the database 
        tables, and clearning the local data objects
    */

    // read a table from the database that is identified
    // with and index. The indices and table names are in
    // mysql/example_dbcfg.js
    function readTable(dbidx, callback) {
        let dbtable = `${dbcfg.parms.database}.${dbcfg.tables[dbidx]}`;
        let cb = callback;

        if(!logmute) log(`readTable(): dbtable = ${dbtable}`);

        staticdata[dbcfg.tables[dbidx]] = [];
        staticdata.dbstates[dbcfg.tables[dbidx]] = false;

        dbobj.readAllRows(dbtable, (table, result, err) => {
            let tbl = table.split('.');
            if(result !== null) {
                result.forEach((row, idx) => {
                    staticdata[tbl[1]].push(JSON.parse(JSON.stringify(row)));
                    if(!logmute) log(`readTable(${tbl[1]}): read & saved - ${JSON.stringify(row)}`);
                });
                staticdata.dbstates[tbl[1]] = true;
                cb(tbl[1], staticdata[tbl[1]].length);
            } else {
                log(`readTable(): ERROR result is null for ${tbl[1]} - ${JSON.stringify(err)}`);
            }
        });
    };

    // clear the local copies of the data tables
    function clearTables() {
        staticdata.actions = [];
        staticdata.actioncats = [];
        staticdata.ipcats = [];
        staticdata.known = [];
        staticdata.attacktypes = [];
        staticdata.macvendors = [];
        staticdata.dbstates.actions = false;
        staticdata.dbstates.actioncats = false;
        staticdata.dbstates.ipcats = false;
        staticdata.dbstates.known = false;
        staticdata.dbstates.attacktypes = false;
        staticdata.dbstates.macvendors = false;
    };

    // iterate through all of the static table indices 
    // and read their data
    function readAll() {
        if(dbopen === true) {
            clearTables();
            // used primarily by logread.js, it's waiting
            // after it has gathered a list of log files 
            // for the STATICDATA_READY event. The watcher
            // doesn't use it because when it's running no 
            // log files exist.
            var tableidx = dbcfg.TABLE_STATIC_BEGIN;
            var tid = setInterval(() => {
                readTable(tableidx, (tbl, len) => {
                    if(tableidx >= dbcfg.TABLE_STATIC_END) {
                        pevts.emit('STATICDATA_READY');
                        clearInterval(tid);
                    } else {
                        tableidx += 1;
                    }
                });
            }, 25);
        } else {
            log(`readAll(): ERROR database not open!`);
        }
    };

    /* ****************************************************
        Public Functions - 
    */
    // searches the "known" table for a value in a specified
    // column in the table.
    staticdata.isKnown = function(unkn, col) {
        if((staticdata.dbstates.known === true) &&
            // use the first known IP in the data to see 
            // if the column is valid.
           (typeof staticdata.known[0][col] !== 'undefined')){
            // the column is good, iterate through the table 
            // to see if its value is "known"
            for(var ix = 0; ix < staticdata.known.length; ix++) {
                if(unkn === staticdata.known[ix][col]) {
                    return staticdata.known[ix];
                }
            }
        }
        return null;
    };

    // return the ID for an attack code string
    staticdata.getAttackID = function(attcode) {
        if(staticdata.dbstates.attacktypes === true) {
            for(var ix = 0; ix < staticdata.attacktypes.length; ix++) {
                if(attcode === staticdata.attacktypes[ix].attackcode) {
                    return staticdata.attacktypes[ix].attackid;
                }
            }
            return 0;
        }
        return null;
    };

    // find the MAC vendor in the static MAC 
    // lookup table, this table and its database
    // table are managed in report.js
    staticdata.getMACVendor = function(mac) {
        if(staticdata.dbstates.macvendors === true) {
            // prep the mac string if necessary....
            // 11:22:33:44:55:66 -> 112233445566 -> 112233
            let macPrefix = (mac.includes(':') ? mac.replace(/:/g,'').substr(0,6) : mac.substr(0,6));
            log(`getMACVendor(): macPrefix = ${macPrefix}`);
            // find it....
            for(var ix = 0; ix < staticdata.macvendors.length; ix++) {
                if(macPrefix === staticdata.macvendors[ix].macPrefix) {
                    // found!
                    log(`getMACVendor(): Found MAC - ${JSON.stringify(staticdata.macvendors[ix])}`);
                    return staticdata.macvendors[ix];
                }
            }
            // not found!
            return 0;
        }
        // error - staticdata not ready
        return null;
    };

    class MACVendRow {
        macPrefix = '';
        company = '';
        address = '';
        country = '';
        updated = '';
        // filled in after retrieval
        updatedStamp = 0;
        // date of addition to db table
        dbsaved = '';
        dbsavedStamp = 0;
    };

    const tstamp = require('time-stamp');

    // save the MAC vendor information to the table  
    // in the database and in the local static data 
    // table
    staticdata.saveMACVendor = function(_macinfo) {
        if(dbopen === true) {
            let macinfo = JSON.parse(_macinfo);
            if(staticdata.getMACVendor(macinfo.macPrefix) === 0) {
                let row = new MACVendRow();
                const keys = Object.keys(row);
                keys.forEach((key) => {
                    // only copy what we need, that is determined by
                    // existing fields in the Row class.
                    if(typeof macinfo[key] !== 'undefined') {
                        row[key] = macinfo[key];
                    }
                });
                // create an epoch value from the mac info
                row.updatedStamp = new Date(row.updated).getTime();
                // update last check/save...
                //row.dbsavedStamp = Date.now();
                row.dbsaved = tstamp('YYYY-MM-DD');
                // should be the start of the day (midnight GMT)
                row.dbsavedStamp = new Date(row.dbsaved).getTime();
    
                // save a local copy
                staticdata.macvendors.push(row);
                log(`saveMACVendor(): pushed ${JSON.stringify(row)}`);
                // write the macinfo to our database...
                let mtable = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_MACVEND_IDX]}`;
                dbobj.writeRow(mtable, row, (target, datawr, insertId, err) => {
                    if(err === null) {
                        log(`saveMACVendor(${datawr.macPrefix}) - saved in ${target}`);
                    } else {
                        // duplicates are not an error, announce them but take no action
                        if(err.code === 'ER_DUP_ENTRY') {
                            if(!logmute) log(`saveMACVendor(${datawr.macPrefix}): Duplicate = ${err.sqlMessage}`);
                        } else {
                            log(`saveMACVendor(): ERROR err = ${err.message}`);
                            // test for and handle recoverable errors...
                        }
                    }
                });
            } else {
                if(!logmute) log(`saveMACVendor(${macinfo.macPrefix}): already saved`);
            }
        } else {
            log(`saveMACVendor(): ERROR database not open!`);
        }
    };

    return staticdata;
});
