'use strict';

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

    var dbopen = false;
    var dbobj = {};
    var dbcfg = {};

    pevts.on('DB_OPEN', (_dbobj) => {
        if(_dbobj.state === true) {
            dbopen = true;
            dbobj = _dbobj.db;
            log(`DB_OPEN: success`);
            dbcfg = dbobj.getDBCcfg();

            readAll();
        } else {
            log(`DB_OPEN: ERROR ${_dbobj.db.err.message}`);
        }
    });

    pevts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
        dbobj = {};
        clearTables();
    });

    var logmute = true;
    log(`init`);

    //////////////////////////////////////////////////////////////////////////
    // 
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
            log(`readAll() - ERROR database not open!`);
        }
    };

    staticdata.isKnown = function(unkn, col) {
        if((staticdata.dbstates.known === true) &&
            // use the first known IP in the data to see 
            // if the column is valid.
           (typeof staticdata.known[0][col] !== 'undefined')){
            for(var ix = 0; ix < staticdata.known.length; ix++) {
                if(unkn === staticdata.known[ix][col]) {
                    return staticdata.known[ix];
                }
            }
        }
        return null;
    };

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

    staticdata.getMACVendor = function(mac) {
        if(staticdata.dbstates.macvendors === true) {
            // prep the mac string if necessary....
            // 11:22:33:44:55:66 -> 112233445566 -> 112233
            let macPrefix = (mac.includes(':') ? mac.replace(/:/g,'').substr(0,6) : mac.substr(0,6));
            // find it....
            for(var ix = 0; ix < staticdata.macvendors.length; ix++) {
                if(macPrefix === staticdata.macvendors[ix].macPrefix) {
                    // found!
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
                row.dbsavedStamp = Date.now();
                row.dbsaved = tstamp('YYYY-MM-DD');
                // should be the start of the day (midnight GMT)
                row.dbsavedStamp = new Date(row.dbsaved).getTime();
    
                // save a local copy
                staticdata.macvendors.push(row);
                // write the macinfo to our database...
                let mtable = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_MACVEND_IDX]}`;
                dbobj.writeRow(mtable, row, (target, datawr, insertId, err) => {
                    if(err === null) {
                        if(!logmute) log(`saveMACVendor(${datawr.macPrefix}) - saved in ${target}`);
                    } else {
                        // duplicates are not an error, announce them but take no action
                        if(err.code === 'ER_DUP_ENTRY') {
                            if(!logmute) log(`saveMACVendor(${datawr.macPrefix}) - Duplicate = ${err.sqlMessage}`);
                        } else {
                            log(`saveMACVendor() - ERROR err = ${err.message}`);
                            // test for and handle recoverable errors...
                        }
                    }
                });
            } else {
                if(!logmute) log(`saveMACVendor(${macinfo.macPrefix}) - already saved`);
            }
        } else {
            log(`saveMACVendor() - ERROR database not open!`);
        }
    };

    return staticdata;
});
