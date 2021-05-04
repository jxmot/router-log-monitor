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
            attacktypes: false
            macvendors: false
        }
    };

    // needed for fs.watch(), fs.statSync(), and
    // fs.accessSync()
    var fs = require('fs');

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

//    staticdata.readAll = function() {
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
        }
    };

// in use
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

// in use
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

    return staticdata;
});
