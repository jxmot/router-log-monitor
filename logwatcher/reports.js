'use strict';
/*
    reports.js - waits for the LOG_DBSAVED event to indicate that 
    a log file has been read, parsed, and  saved to the database.

    Then it will read the recently saved records and filter, search,
    and/or copy data to table(s) that can be read and processed later.

    The static HTML reports will be created from those tables.
*/
module.exports = (function({constants, staticdata, pevts, _log}) {

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
            dbobj  = _dbobj.db;
            dbcfg  = dbobj.getDBCcfg();
            log(`DB_OPEN: success`);

            // for TESTING only, will be removed.
            //log(`initiate TEST_REPORT`);
            //pevts.emit('TEST_REPORT');

        } else {
            log(`DB_OPEN: ERROR ${dbobj.db.err.message}`);
        }
    });

    pevts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
        dbobj = {};
    });

    var logmute = true;
    log(`init`);

    pevts.on('LOG_PROCESSED', (wfile) => {
        log(`last processed file: ${wfile.path}${wfile.filename}`);
    });

    pevts.on('LOG_DBSAVED', (wfile) => {
        log(`log saved to database, saved ${wfile.linecount - wfile.badcount} log entries from ${wfile.path}${wfile.filename}`);
        if(dbopen === true) {
            log(`reporting on data from -  ${wfile.path}${wfile.filename} during ${wfile.start} to ${wfile.stop}`);
            reportActions(constants.LAN_ACC, 0, {start:wfile.start,stop:wfile.stop});
        }
    });

    function isKnownIP(row) {
        return staticdata.isKnownIP(row.ip);
    };

    const dns = require('dns');
    function updateInvasionHosts(table, datarow) {
        // isolate from the arg, so that we don't interfere with clean up
        let updrow = JSON.parse(JSON.stringify(datarow));

        // host lookup & update the row
        dns.reverse(updrow.ip, (err, hosts) => {
            if(err) {
                log(`updateHosts(): dns.reverse() ${err.toString()}`);
                hosts = [];
                hosts.push(`${err.code} - ${err.hostname}`);
            }
    
            if(hosts.length > 1) {
                updrow.hostname = hosts.join(',');
            } else {
                if(hosts.length > 0) {
                    updrow.hostname = hosts[0];
                } else {
                    updrow.hostname = null;
                }
            }

            if(updrow.hostname !== null) {
                // update the row...
                dbobj.updateRows(table, {hostname:updrow.hostname}, `entrynumb = ${updrow.entrynumb}`, (target, result, err) => {
                    if(err !== null) {
                        log(`updateInvasionHosts(): ERROR err = ${err.message}`);
                        process.exit(0);
                    } else {
                        if(!logmute) log(`updateInvasionHosts(): SUCCESS = ${result}`);
                    }
                });
            }
        });
    };

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
    function reportActions(action, depth = constants.MONTHS_1_MS, range = null) {
        const dbtable  = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_LOGENTRY_IDX]}`;
        let criteria   = '';

        // check for valid 'action' values...
        if((action >= constants.MIN_ACTN) && (action <= constants.MAX_ACTN)) {
            // was a 'depth' passed in?
            if(depth > 0) {
                // get all newer than now minus the 'depth'
                criteria = `actionid = ${action} and tstamp >= ${(Date.now() - depth)} order by tstamp asc`;
            } else {
                // no depth, range?
                if(range === null) {
                    // get all with matching 'action'
                    criteria = `actionid = ${action} order by tstamp asc`;
                } else {
                    // get all within the specified date/time range
                    criteria = `actionid = ${action} and tstamp >= ${range.start} and tstamp <= ${range.stop} order by tstamp asc`;
                }
            }

            // read rows as specified...
            dbobj.readRows(dbtable, criteria, (table, _criteria, data, err) => {
                if(err !== null) {
                    log(`reportActions(): ERROR err = ${JSON.stringify(err)}`);
                    exit(0);
                } else {
                    if(!logmute) log(`reportActions(): got data, ${data.length} rows returned`);
                    // action-specific....
                    //
 
                    // LAN Access from External IPs
                    if(action === constants.LAN_ACC) {
                        class Row {
                            tstamp    = 0;
                            entrynumb = 0;
                            ip        = '';
                            port      = '';
                            toip      = '';
                            toport    = '';
                            hostname  = '';
                            // temporary
                            logfile   = '';
                            logentry  = '';
                        };
                        // iterate through all rows returned to us...
                        for(var ix = 0; ix < data.length; ix++) {
                            // only record an invasion if the IP is not known
                            if(isKnownIP(data[ix]) === null) {
                                // not known...
                                const itable  = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_INVASIONS_IDX]}`;
        
                                // copy columns from the row into the new row...
                                var newrow = new Row();
                                const keys = Object.keys(data[ix]);
                                keys.forEach((key) => {
                                    // only copy what we need, that is determined by
                                    // existing fields in the Row class.
                                    if(typeof newrow[key] !== 'undefined') {
                                        newrow[key] = data[ix][key];
                                    }
                                });

                                dbobj.writeRow(itable, newrow, (target, datawr, insertId, err) => {
                                    if(err === null) {
                                        if(!logmute) log(`reportActions(${action}): saved in ${target}`);
                                        // post processing....
                                        updateInvasionHosts(itable, datawr);
                                    } else {
                                        // duplicates are not an error, announce them but take no action
                                        if(err.code === 'ER_DUP_ENTRY') {
                                            if(!logmute) log(`reportActions(${action}): Duplicate = ${err.sqlMessage}`);
                                        } else {
                                            log(`reportActions(${action}): ERROR err = ${err.message}`);
                                            // test for and handle recoverable errors...
                                        }
                                    }
                                });
                                // clean-up, the MySQL functions will "copy" the values to 
                                // an internal SQL string. That occurs during the call to 
                                // writeRow() and the subsequent calls to the MySQL functions.
                                // This was verified by single-stepping into - 
                                // node_modules/sqlstring/lib/SqlString.js:98(v2.3.1)
                                newrow = null;
                            } else {
                                if(!logmute) log(`reportActions(${action}): IP is known ${data[ix].ip}`)
                            }
                        }
                    } // ^LAN Access from External IPs
                }
            });
        }
    };
/*
    pevts.on('TEST_REPORT', () => {
        if(dbopen === true) {
            // get all occurrences of LAN_ACC
            //reportActions(constants.LAN_ACC, 0);
            // get all occurrences in the past month of LAN_ACC
            //reportActions(constants.LAN_ACC);
        }
    });
*/
});



