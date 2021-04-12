/*
    reports.js - waits for the LOG_PROCESSED event and 
    reads the database to generate static reports
*/
module.exports = (function(pevts, _log) {
    // set up run-time logging
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    }

    var constants = require('./constants.js');

    var dbopen = false;
    var dbobj = {};
    var dbcfg = {};

    pevts.on('DB_OPEN', (_dbobj) => {
        if(_dbobj.state === true) {
            dbopen = true;
            dbobj  = _dbobj.db;
            dbcfg  = dbobj.getDBCcfg();
            log(`- DB_OPEN: success`);
        } else {
            log(`- DB_OPEN: ERROR ${dbobj.db.err.message}`);
        }
    });

    pevts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
        dbobj = {};
    });

    log(`- init`);

    pevts.on('LOG_PROCESSED', (wfile) => {
        log(`- last processed file: ${wfile.path}${wfile.filename}`);
    });

    pevts.on('LOG_DBSAVED', (wfile) => {
        log(`- log saved to database, saved ${wfile.linecount - wfile.badcount} log entries from ${wfile.path}${wfile.filename}`);
        if(dbopen === true) {
//            reportActions(constants.LAN_ACC);
        }
    });

    /*
        Static Reports:
    
        Remote Access - Past N days, Day X through Day Y
    
        Checks IP against rlmonitor.known:
            "is known" - do not report 
            "unknown" - report (and try reverse IP?)


        Get "LAN access from remote" data for the past 30 days(default) -
            reportActions(constants.LAN_ACC);


        Get all of the "LAN access from remote" data -
            reportActions(constants.LAN_ACC, 0);


        Get "LAN access from remote" data in a specified date range - 
            reportActions(constants.LAN_ACC, 0, {start:1617253200000,stop:1618218734000});

        

    */
    function reportActions(action, depth = constants.DAYS_30_MS, range = null) {
        var dbtable  = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_LOGENTRY_IDX]}`;
        var start    = 0;
        var criteria = '';
        if(depth > 0) {
            start    = (Date.now() - depth);
            criteria = `actionid = ${action} and tstamp >= ${start} order by tstamp asc`;
        } else {
            if(range === null) {
                criteria = `actionid = ${action} order by tstamp asc`;
            } else {
                criteria = `actionid = ${action} and tstamp >= ${range.start} and tstamp <= ${range.stop} order by tstamp asc`;
            }
        }

        dbobj.readRows(dbtable, criteria, (table, data, err) => {
            if(err !== null) {
                log(`- ERR in reportActions() err = ${JSON.stringify(err)}`);
            } else {
                log(`- reportActions() got data`);
            }
        });
    };

    pevts.on('TEST_REPORT', () => {
        if(dbopen === true) {
            reportActions(constants.LAN_ACC);
        }
    });
});



