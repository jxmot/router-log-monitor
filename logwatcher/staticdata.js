module.exports = (function(pevts, _log)  {

    // NOTE: property names are identical matches to 
    // the table names in our database 
    staticdata = {
        actions: [],
        actioncats: [],
        ipcats: [],
        known: [],
        dbstates: {
            actions: false,
            actioncats: false,
            ipcats: false,
            known: false
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

            staticdata.readAll();
            //setTimeout(staticdata.readAll, 100);

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
    function readTable(dbidx, callback = null) {
        let dbtable = `${dbcfg.parms.database}.${dbcfg.tables[dbidx]}`;
        let cb = callback;

        if(!logmute) log(`readTable(): dbtable = ${dbtable}`);

        staticdata[dbcfg.tables[dbidx]] = [];
        staticdata.dbstates[dbcfg.tables[dbidx]] = false;

        dbobj.readAllRows(dbtable, (table, result, err) => {
            tbl = table.split('.');
            if(result !== null) {
                result.forEach((row, idx) => {
                    staticdata[tbl[1]].push(JSON.parse(JSON.stringify(row)));
                    if(!logmute) log(`readTable(${tbl[1]}): read & saved - ${JSON.stringify(row)}`);
                });
                staticdata.dbstates[tbl[1]] = true;
                if(cb === null) pevts.emit('STATICDATA_READY', tbl[1], staticdata);
                else cb(tbl[1], staticdata[tbl[1]].length);
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
        staticdata.dbstates.actions = false;
        staticdata.dbstates.actioncats = false;
        staticdata.dbstates.ipcats = false;
        staticdata.dbstates.known = false;
    };

    staticdata.readAll = function() {
        if(dbopen === true) {
            clearTables();
            // NOTE: it is important that readActions() 
            // is first, logread.js:DATA_READY requires it.


            // read the actions table from the database and populate
            // an array of action objects
            readTable(dbcfg.TABLE_ACTIONS_IDX);
            // read the action category table from the database and populate
            // an array of action category objects
            readTable(dbcfg.TABLE_ACTIONCATS_IDX);
            // read the IP category table from the database and populate
            // an array of IP category objects
            readTable(dbcfg.TABLE_IPCATS_IDX);
            // read the known table from the database and populate
            // an array of known objects
            readTable(dbcfg.TABLE_KNOWN_IDX);
        }
    };

    staticdata.isKnownIP = function(ipaddr) {
        if(staticdata.dbstates.known === true) {
            for(var ix = 0; ix < staticdata.known.length; ix++) {
                if(ipaddr === staticdata.known[ix].ip) {
                    return staticdata.known[ix];
                }
            }
        }
        return null;
    };

    function getIPInfo(get, ipaddr) {
        let info = staticdata.isKnownIP(ipaddr);
        if(info !== null) {
            return info[get];
        } else return null;
    };

    staticdata.getIPMAC = function(ipaddr) {
        return getIPInfo('mac', ipaddr);
    };

    staticdata.getIPCat = function(ipaddr) {
        return getIPInfo('ipcat', ipaddr);
    };

    staticdata.getIPDevice = function(ipaddr) {
        return getIPInfo('device', ipaddr);
    };

    staticdata.getIPWatch = function(ipaddr) {
        return getIPInfo('watch', ipaddr);
    };


    return staticdata;
});
