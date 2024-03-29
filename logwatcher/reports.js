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

    var logmute = false;
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

    // when the database is open and ready we can 
    // create report tables
    pevts.on('DB_OPEN', (_dbobj) => {
        if(_dbobj.state === true) {
            dbopen = true;
            dbobj  = _dbobj.db;
            dbcfg  = dbobj.getDBCcfg();
            log(`DB_OPEN: success`);
        } else {
            log(`DB_OPEN: ERROR ${dbobj.db.err.message}`);
        }
    });

    // database has been closed, change state and clear 
    // objects and data...
    pevts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
        dbobj = {};
    });

    pevts.on('LOG_PROCESSED', (wfile) => {
        log(`LOG_PROCESSED: last processed file: ${wfile.path}${wfile.filename}`);
    });

    pevts.on('LOG_DBSAVED', (wfile) => {
        log(`LOG_DBSAVED: log saved to database, saved ${wfile.linecount - wfile.badcount} log entries from ${wfile.path}${wfile.filename}`);
        if(dbopen === true) {
// start the exit-watchdog if not already started

            log(`reporting on data from ${wfile.start} to ${wfile.stop}`);
            reportActions(constants.LAN_ACC,   0, {start:wfile.start,stop:wfile.stop});
            reportActions(constants.DOS_ATT,   0, {start:wfile.start,stop:wfile.stop});
            reportActions(constants.WLAN_REJ,  0, {start:wfile.start,stop:wfile.stop});
            reportActions(constants.DHCP_IP,   0, {start:wfile.start,stop:wfile.stop});
            reportActions(constants.INET_CONN, 0, {start:wfile.start,stop:wfile.stop});
            reportActions(constants.INET_DCONN,0, {start:wfile.start,stop:wfile.stop});
/*
            reportActions(constants.DYN_DNS,   0, {start:wfile.start,stop:wfile.stop});
*/
            log(`LOG_DBSAVED: done reporting on data`);
        }
    });

    function isKnown(row, col) {
        return staticdata.isKnown(row[col], col);
    };

    /* ****************************************************
        do a reverse DNS on external IP addresses
    */
    const dns = require('dns');
    function updateHostname(table, datarow) {
        // isolate from the arg, so that we don't interfere with clean up
        let updrow = JSON.parse(JSON.stringify(datarow));

        // host lookup & update the row
        dns.reverse(updrow.ip, (err, hosts) => {
            if(err) {
                if(!logmute) log(`updateHostname(): dns.reverse() ${err.toString()}`);
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
                if(!logmute) log(`updateHostname(): hostname = ${updrow.hostname}`);
                // update the row...
                dbobj.updateRows(table, {hostname:updrow.hostname}, `entrynumb = ${updrow.entrynumb}`, (target, result, err) => {
                    if(err !== null) {
                        log(`updateHostname(): ERROR err = ${err.message}`);
                        process.exit(0);
                    } else {
                        if(!logmute) log(`updateHostname(): SUCCESS = ${result}`);
                    }
                });
            }
        });
    };

    /* ****************************************************
        MAC Manufacturer Look UP 

        The "free" service is sufficient for our purposes,
        more info at - 
            https://maclookup.app/api-v2/rate-limits

        A good attempt is made to limit the number of 
        API hits. As MAC addresses are found via the API 
        they're saved in a database table. Then when a 
        MAC manufacturer is needed the database is searched
        first, if found there then no call to the API is 
        needed.
    */
    const https = require('https');
    const mcfg = require('./macinfocfg.js');

    // get MAC info via the API
    function getMACInfoAPI(mac, callback) {
        let opt = {
            hostname: mcfg.hostname,
            method: 'GET',
            path: mcfg.urlparts[0] + mac + mcfg.urlparts[1] + mcfg.apikey,
            headers: {
                'accept':mcfg. headeraccept
                ,'user-agent': mcfg.useragent
            }
        };

        log(`getMACInfoAPI() - seeking ${mac} via API`);

        let req = https.request(opt, res => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', function(d) {
                if(!logmute) log(`getMACInfoAPI() - status code: ${res.statusCode}`);
                if(res.statusCode === 200) {
                   if(!logmute) log(`getMACInfoAPI() - x-ratelimit-remaining: ${res.headers['x-ratelimit-remaining']}`);
                   if(mcfg.savemac === true) {
                        log(`getMACInfoAPI() - found ${mac} via API, saving to database...`);
                        staticdata.saveMACVendor(data.toString());
                    }
                    log(`getMACInfoAPI() - found ${mac} via API, executing call back...`);
                    callback(false, data.toString());
                } else {
                    log(`getMACInfoAPI(): ERROR from ${mcfg.hostname} - ${res.statusCode}`);
                    callback(true, data.toString());
                }
            });
        });

        req.on('error', (err) => {
            log(`getMACInfoAPI(): ERROR - ${err.message} - ${JSON.stringify(opt)}`);
            callback(true, err.message);
        }); 
    
        // send the request
        req.end();
    };

    // get MAC info, this function is called first. 
    function getMACInfo(mac, callback) {
        // first, try to find the mac in staticdata.macvendors...
        let macv = staticdata.getMACVendor(mac);
        if(macv === 0) {
            log(`getMACInfo() - ${mac} not found in static data, trying API...`);
            // not found, try the api...
            getMACInfoAPI(mac, callback);
        } else if(macv === null) {
            log(`getMACInfo() - static data NOT ready!`);
        }
        return macv;
    };

    // update our MAC info database table
    function updbMAC(table, rowdata) {
        // update the row...
        dbobj.updateRows(table, {macmfr:rowdata.macmfr}, `entrynumb = ${rowdata.entrynumb}`, (target, result, err) => {
            if(err !== null) {
                log(`updbMAC(): ERROR err = ${err.message}`);
                process.exit(0);
            } else {
                if(!logmute) log(`updbMAC(): SUCCESS = ${result}  entrynumb = ${rowdata.entrynumb}`);
            }
        });
    }

    // update the log entry's MAC information...
    function updateMACMfr(table, datarow) {
        // isolate from the arg, so that we don't interfere with clean up
        let updrow = JSON.parse(JSON.stringify(datarow));
        // look up MAC.... 
        //      check our local database first (staticdata)
        let macv = getMACInfo(updrow.mac, (err, data) => {
            if(err === false) {
                // had to search the API, found and updated
                // static data and database
                updrow.macmfr = JSON.parse(data).company;
                updbMAC(table, updrow);
            } else {
                log(`updateMACMfr(): ERROR - ${table} -- ${JSON.stringify(updrow)}`)
            }
        });
        if(macv) {
            // on return, update table
            updrow.macmfr = macv.company;
            updbMAC(table, updrow);
        }
    };

    /* ****************************************************
        Generate a Report Database Table 

        Generates a "report" table in the database using
        a configuration block.
    */
    function genReportTable({action, RowClass, data, tableidx, knowit, gethost = false, getmacmfr = false, subparser = null, extra = null}) {
        const atable  = `${dbcfg.parms.database}.${dbcfg.tables[tableidx]}`;
        // iterate through all rows returned to us...
        for(var ix = 0; ix < data.length; ix++) {
            // copy columns from the row into the new row...
            var newrow = new RowClass();
            const keys = Object.keys(data[ix]);
            // use keys found in data[] to find matches in the new row
            keys.forEach((key) => {
                // only copy what we need, that is determined by
                // existing keys in the Row class. 
                if(typeof newrow[key] !== 'undefined') {
                    newrow[key] = data[ix][key];
                }
            });

            // some reports may require additional processing
            if(subparser !== null) {
               newrow = Object.assign(newrow, subparser(data[ix]));
            }
            // if we are going to get the MAC info then that type
            // of report table will have these columns :
            // known, knownip, device
            const known = (knowit === null ? null : isKnown(data[ix], knowit));

            if(gethost === false) {
                // if it's a known device and MAC info retreival is 
                // enabled then copy the known info. at this time 
                // only the DHCP_IP and WLAN_REJ log entries contain
                // MAC addresses. 
                if((known !== null) && (getmacmfr === true)) {
                    newrow.known   = true;
                    newrow.knownip = known.ip;
                    newrow.device  = known.device;
                    if(typeof newrow.givenip !== 'undefined') {
                        newrow.givenip = data[ix].ip;
                        newrow.errip   = (newrow.knownip === newrow.givenip ? false : true);
                    }
                } else {
                    // some tables do not have a "known" column, so 
                    // "known" is only valid when "knowit" is not null
                    if(knowit !== null) newrow.known = false;
                }
            } else {
                if(known !== null) {
                    newrow.known = true;
                    if(extra !== null) {
                         if(typeof extra.hideknown !== 'undefined') {
                            if(extra.hideknown === true) {
                                if(!logmute) log(`genReportTable(${action}): not saving known ${knowit} - ${known[knowit]}`);
                                newrow = null;
                                continue;
                            }
                        }
                    }
                }
            }

            // save to the report table...
            dbobj.writeRow(atable, newrow, (target, datawr, insertId, err) => {
                if(err === null) {
                    if(!logmute) log(`genReportTable(): ${datawr.entrynumb} saved in ${target}`);
// pet the exit-watchdog
                    // post processing.... (updates the table)
                    if(gethost === true) updateHostname(atable, datawr);
                    if(getmacmfr === true) {
                        // only get MAC info if it is not known
                        if((typeof datawr.known !== 'undefined') && (datawr.known === false)) {
                            updateMACMfr(atable, datawr);
                        }
                    }
                } else {
                    // duplicates are not an error, announce them but take no action
                    if(err.code === 'ER_DUP_ENTRY') {
                        if(!logmute) log(`genReportTable(${action}): Duplicate = ${err.sqlMessage}`);
                    } else {
                        log(`genReportTable(${action}): ERROR err = ${err.message}`);
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
        }
    };

    /* ****************************************************
        The Report Table Functions

        
    */
    // argument for report functions
    class grtArgs {
        action    =  -1;
        RowClass  = null;
        data      = null;
        tableidx  = -1;
        gethost   = false;
        getmacmfr = false;
        subparser = null;
        extra     = null;
    };

    // matches the database table rlmonitor.attacks
    class AttackRow {
        tstamp    = 0;
        entrynumb = 0;
        ip        = '';
        attackcode= '';
        attackid  = 0;
        qty       = 0;
        sec       = 0;
        known     = false;
        hostname  = '';
        message   = '';
        logfile   = '';
        logentry  = '';
    };

    // a sub-parser, determines the attack type and returns an object
    function parseAttack(rowdata) {
        /*

          attackcode  qty                       sec

            FIN Scan: (1) attack packets in last 20 sec from ip [151.101.65.69]
            ACK Scan: (1) attack packets in last 20 sec from ip [151.101.65.69]
            STORM: (1) attack packets in last 20 sec from ip [151.101.65.69]
            Smurf: (1) attack packets in last 20 sec from ip [151.101.65.69]
        */
        let newrow = {};
        let tmp = rowdata['message'].split(':');
        newrow.attackcode = tmp[0];
        if((newrow.attackid = staticdata.getAttackID(newrow.attackcode)) === 0) {
            newrow.attackid = constants.DOS_ATT_UNK;
        } else {
            if(newrow.attackid === null) {
                log(`parseAttack(): ERROR - staticdata is not ready`);
                process.exit(0);
            }
        }

        // parse quantity of attacks
        let qtmp = tmp[1].split('(');
        let q    = qtmp[1].split(')');
        newrow.qty = parseInt(q[0]);

        // parse time in seconds of attack duration
        let s = q[1].split(' ');
        newrow.sec = parseInt(s[5]);

        if(!logmute) log(`parseAttack(): SUCCESS - ${JSON.stringify(newrow)}`);

        return newrow;
    };

    // create a report table in the database, we will use it later
    // when creating human-readble reports
    function reportDOS_ATT(_data) {
        let argsATT = new grtArgs();
        // arguments, 
        argsATT.action   = constants.DOS_ATT;
        argsATT.RowClass = AttackRow;
        argsATT.data     = _data;
        argsATT.tableidx = dbcfg.TABLE_ATTACKS_IDX;
        argsATT.knowit   = 'ip';
        argsATT.gethost  = true;
        argsATT.getmacmfr= false;
        argsATT.subparser= parseAttack;
        // write the data to the report table...
        genReportTable(argsATT);
        argsATT = null;
    };

    class AccessRow {
        tstamp    = 0;
        entrynumb = 0;
        ip        = '';
        known     = false;
        port      = '';
        toip      = '';
        toport    = '';
        hostname  = '';
        logfile   = '';
        logentry  = '';
    };

    function reportLAN_ACC(_data) {
        let argsACC = new grtArgs();
    
        argsACC.action   = constants.LAN_ACC;
        argsACC.RowClass = AccessRow;
        argsACC.data     = _data;
        argsACC.tableidx = dbcfg.TABLE_LANACCESS_IDX;
        argsACC.knowit   = 'ip';
        argsACC.gethost  = true;
        argsACC.getmacmfr= false;
        argsACC.subparser= null;

        argsACC.extra    = {hideknown: true};
    
        genReportTable(argsACC);
        argsACC = null;
    };

    // identical to DHCPRow
    class RejectRow {
        tstamp    = 0;
        entrynumb = 0;
        mac       = '';
        message   = '';
        known     = false;
        knownip   = '';
        device    = '';
        macmfr    = '';
        logfile   = '';
        logentry  = '';
    };

    function reportWLAN_REJ(_data) {
        let argsREJ = new grtArgs();
    
        argsREJ.action   = constants.WLAN_REJ;
        argsREJ.RowClass = RejectRow;
        argsREJ.data     = _data;
        argsREJ.tableidx = dbcfg.TABLE_WLANREJS_IDX;
        argsREJ.knowit   = 'mac';
        argsREJ.gethost  = false;
        argsREJ.getmacmfr= true;
        argsREJ.subparser= null;
    
        genReportTable(argsREJ);
        argsREJ = null;
    };

    // identical to RejectRow
    class DHCPRow {
        tstamp    = 0;
        entrynumb = 0;
        mac       = '';
        known     = false;
        knownip   = '';
        givenip   = '';
        errip     = false;
        device    = '';
        macmfr    = '';
        logfile   = '';
        logentry  = '';
    };

    function reportDHCP_IP(_data) {
        let argsDHCP = new grtArgs();
    
        argsDHCP.action   = constants.DHCP_IP;
        argsDHCP.RowClass = DHCPRow;
        argsDHCP.data     = _data;
        argsDHCP.tableidx = dbcfg.TABLE_DHCPIP_IDX;
        argsDHCP.knowit   = 'mac';
        argsDHCP.gethost  = false;
        argsDHCP.getmacmfr= true;
        argsDHCP.subparser= null;
    
        genReportTable(argsDHCP);
        argsDHCP = null;
    };

    class INETCONNRow {
        tstamp    = 0;
        entrynumb = 0;
        ip        = '';
        logfile   = '';
        logentry  = '';
    };

    function reportINETCONN(_data, action = constants.INET_CONN) {
        let argsINET = new grtArgs();
    
        argsINET.action   = action;
        argsINET.RowClass = INETCONNRow;
        argsINET.data     = _data;
        argsINET.tableidx = dbcfg.TABLE_INETCONN_IDX;
        argsINET.knowit   = null;
        argsINET.gethost  = false;
        argsINET.getmacmfr= false;
        argsINET.subparser= null;
    
        genReportTable(argsINET);
        argsINET = null;
    };

    function reportINETDCONN(_data) {
        reportINETCONN(_data, constants.INET_DCONN);
    };

    // report tables that are written to here,
    // if 'null' then do nothing.
    // NOTE: The order here is the same as in 
    // constants.js for convenience.
    let reports = [
        null,               // ADM_LOG    
        reportDHCP_IP,      // DHCP_IP    
        reportDOS_ATT,      // DOS_ATT    
        null,               // DYN_DNS    
        null,               // FIRMW_UP   
        reportINETCONN,     // INET_CONN  
        reportINETDCONN,    // INET_DCONN 
        reportLAN_ACC,      // LAN_ACC    
        null,               // TIME_SYNC  
        reportWLAN_REJ,     // WLAN_REJ   
        null,               // UPNP_EVENT 
    ];

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
                criteria = `actionid = ${action} and tstamp >= ${(Date.now() - depth)} order by entrynumb asc`;
//                criteria = `actionid = ${action} and tstamp >= ${(Date.now() - depth)} order by tstamp asc`;
            } else {
                // no depth, range?
                if(range === null) {
                    // get all with matching 'action'
                    criteria = `actionid = ${action} order by entrynumb asc`;
//                    criteria = `actionid = ${action} order by tstamp asc`;
                } else {
                    // get all within the specified date/time range
                    criteria = `actionid = ${action} and tstamp >= ${range.start} and tstamp <= ${range.stop} order by entrynumb asc`;
//                    criteria = `actionid = ${action} and tstamp >= ${range.start} and tstamp <= ${range.stop} order by tstamp asc`;
                }
            }

            // read rows as specified...
            dbobj.readRows(dbtable, criteria, (table, _criteria, data, err) => {
                if(err !== null) {
                    if((err.errno === true) && (err.code === -1) && (err.message === 'not found')) {
                        if(!logmute) log(`reportActions(): could not find in ${table} where [${_criteria}]`);
                    } else {
                        log(`reportActions(): ERROR err = ${JSON.stringify(err)} in ${table} seeking [${_criteria}]`);
                        process.exit(0);
                    }
                } else {
                    if(!logmute) log(`reportActions(): got data, ${data.length} rows returned from ${table} where [${_criteria}]`);
                    // action-specific....
                    let tmp  = _criteria.split(' ');
                    let actn = parseInt(tmp[2]);
                    if(!logmute) log(`reportActions(): recovered Action = ${actn} from [${_criteria}]`);
                    if(data.length > 0) {
                        if(reports[actn - 1] !== null) {
                            reports[actn - 1](data);
                        }
                    } else {
                        if(!logmute) log(`reportActions(): no data found for action = ${actn}`);
                    }
                }
            });
        }
    };


//////////////////////////////////////////////////////////////////////////////
// This is how testing was done. When STATICDATA_READY event occurs we will 
// trigger the test(s).
// 
// The side benefit of testing (with over 100k log entries!) is that the report 
// tables will be generated here and when the app goes "live" then it will 
// only have to deal with a days worth of log entries. 
// 
// The following function is commented out when testing is complete

//   pevts.on('STATICDATA_READY', () => {
//       // for TESTING only, will be removed.
//       log(`initiate TEST_REPORT`);
//       pevts.emit('TEST_REPORT');
//   });

    pevts.on('TEST_REPORT', () => {
        if(dbopen === true) {
// tests complete - 2021-05-09
            // get all occurrences of in the past month DHCP_IP
            // because at this time there are 77K of DHCP records 
            // and anything older than 30 days is not useful.
            //reportActions(constants.DHCP_IP);
            // get all occurrences of WLAN_REJ
            //reportActions(constants.WLAN_REJ, 0);
            // get all occurrences of DOS_ATT
            //reportActions(constants.DOS_ATT, 0);
            // get all occurrences of LAN_ACC
            //reportActions(constants.LAN_ACC, 0);
            // get all occurrences
            //reportActions(constants.INET_CONN, 0);
            //reportActions(constants.INET_DCONN, 0);
        }
    });
// end of testing code
//////////////////////////////////////////////////////////////////////////////
});



