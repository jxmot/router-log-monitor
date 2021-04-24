'use strict';
/*
    logdata.js - this is where the log file will be parsed
    and written to the detabase
*/
module.exports = (function({constants, staticdata, pevts, _log})  {
    
    var logdata = {};

    // needed for fs.watch(), fs.statSync(), and fs.accessSync()
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
        } else {
            log(`DB_OPEN: ERROR ${_dbobj.db.err.message}`);
        }
    });

    pevts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
        dbobj = {};
    });

    var logmute = true;
    log(`init`);

    logdata.process = function(wfile) {
        if(dbopen === false) {
            log(`process(): database not open`);
            dbobj = {};
        } else {
            // parse the log data and write to database...
            log(`process(): ${wfile.path}${wfile.filename}`);
            logToDB(wfile);
            log(`process(): done ${wfile.path}${wfile.filename}`);
            // announce completion...
            // NOTE: This is only the point where we've finished 
            // writing the entries to the database. It is NOT an
            // indication that all of the entries have been written 
            // to the database.
            pevts.emit('LOG_PROCESSED', wfile);
        }
        return dbopen;
    };

    class LogEntry {
        tstamp = 0;
        actionid = 0;
        ip = '';
        port = '';
        toip  = '';
        toport  = ''; 
        host = '';
        mac = '';
        message = '';
        logfile = '';
        logentry = '';
    };

    function logToDB(wfile) {
        // make sure the file is valid
        if(typeof wfile !== 'undefined') {
            if(!logmute) log(`- logToDB(): checking ${wfile.path}${wfile.filename}`);
            try {
                fs.accessSync(`${wfile.path}${wfile.filename}`, fs.constants.F_OK);
            } catch(err) {
                if(err.code === 'ENOENT') {
                    log(`- logToDB(): does not exist: ${wfile.path}${wfile.filename}`);
                    // emit error?
                }
                return;
            }
            // valid, open and read it 
            // https://nodejs.org/docs/latest-v12.x/api/fs.html#fs_fs_opensync_path_flags_mode
            if(!logmute) log(`- logToDB(): opening ${wfile.path}${wfile.filename}`);
            // Was using fs.readSync() but there was a bug. For info can be found
            // at - https://github.com/jxmot/nodejs-readSync-bug
            var logstr = fs.readFileSync(`${wfile.path}${wfile.filename}`, 'utf8');         
            if(!logmute) log(`- logToDB(): read ${logstr.length} bytes of ${wfile.size} from ${wfile.path}${wfile.filename}`);

            // body string to array of lines
            var logarr = logstr.split("\n");

            // interate through array of lines - 
            //      parse each line into object
            //      write object to db
            //      next line
            if(!logmute) log(`- logToDB(): found ${logarr.length} entries in ${wfile.path}${wfile.filename}`);
            const lineqty = logarr.length;
            var linecount = 0;
            var badcount = 0;
            logarr.forEach((entry, idx) => {
                var newrow = parseEntry(entry, idx);
                // for debugging defective logs
                newrow.logfile = wfile.filename;
                // write the data...
                // the log entry table has an auto increment primary key, 
                // it is called "entrynumb". After the record is written
                // its value is in "insertId".
                //
                // 
                var dest = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_LOGENTRY_IDX]}`;
                // NOTE: The conditions that determine a "bad" record could be checked 
                // before writing it to the database. However, we want 'entrynumb' to be 
                // contiguous. And the gaps in count that end up in the logentry table are
                // intentional and can be used later.
                dbobj.writeRow(dest, newrow, (target, data, insertId, err) => {
                    if(err === null) {
                        if(!logmute) log(`- logToDB(): success - ${target} ${JSON.stringify(data)}`);
                        // are "bad" records to be handled?
                        if(wfile.movebad === true) {
                            // currently, only one indicator to use to determine 
                            // if the log entry is bad...
                            // if the time stamp is BEFORE the "minimum" time 
                            // stamp then it's a bad record and won't be usable.
                            if(wfile.mintstamp > data.tstamp) {
                                if(!logmute) log(` - logToDB(): BAD timestamp - ${target} ${insertId} ${data.tstamp}`);
                                // the table we're using has an auto increment primary
                                // ID. And we call it 'entrynumb' in the table. After
                                // the row is written we will merge it with the row
                                // data and write that to the table used for storing
                                // "bad" entries.
                                var badrec = Object.assign(data, {entrynumb:insertId});
                                saveBadEntry(badrec, wfile);
                                badcount += 1;
                            }
                        }
                        if((linecount += 1) === lineqty) {
                            wfile.linecount = linecount;
                            wfile.badcount  = badcount;
                            pevts.emit('LOG_DBSAVED', wfile);
                        }
                    } else {
                        log(`- logToDB(): writeRow() FAIL - ${target} ${JSON.stringify(data)}`);
                    }
                    delete data;
                    delete newrow;
                });
            });
        } else {
            log(`- logToDB(): undefined - wfile`);
        }
    };

    function saveBadEntry(badrec, wfile) {
        // write the data...
        var dest = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_LOGENTRYBAD_IDX]}`;
        dbobj.writeRow(dest, badrec, (target, data, insertId, err) => {
            if(err === null) {
                if(!logmute) log(`- saveBadEntry(): saved bad entry, delbad = ${wfile.delbad}`);
                if(wfile.delbad === true) {
                    // remove bad record from log entry table
                    var badplace = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_LOGENTRY_IDX]}`;
                    dbobj.deleteRow(badplace, `entrynumb = ${data.entrynumb}`, (table, keyfield, affected, err) => {
                        if(err === null) {
                            if(!logmute) log(`- saveBadEntry(): deleted bad entry in ${badplace}`);
                        } else {
                            log(`- saveBadEntry(): FAILED to delete bad entry in ${badplace}`);
                        }
                    });
                }
            } else {
                log(`- saveBadEntry(): FAILED to save bad entry in ${dest}`);
            }
        });
    };

    function parseEntry(_entry, idx) {
        var tmp    = _entry.replace("\n",'');
        var entry  = tmp.replace("\r",'');

        var entObj = new LogEntry;
        // for debugging defective logs
        entObj.logentry = entry;
        // build the fields and add them to the entry object
        entObj.tstamp = getTimestamp(entry);
        // get the action identifiers
        var actn = getAction(entry);
        if(actn.id === -1) {
            entObj.actionid = -1;
            log(`- parseEntry(): ${actn.code}`);
        } else {
            entObj.actionid = actn.id;
            // 
            var parms = getActionParms(actn, entry);
            if(typeof parms.err !== 'undefined') {
                log(`- parseEntry(): ERROR 1/3 - ${parms.err.msg} ${parms.err.ent}`);
                log(`- parseEntry(): ERROR 2/3 - ${entObj.tstamp} ${_entry}`);
                log(`- parseEntry(): ERROR 3/3 - ${JSON.stringify(parms)}`);
                // the err object cannot be written to the database
                delete parms.err;
            }
            // 
            entObj = Object.assign(entObj, parms);
            if(!logmute) log(`- parseEntry(): entObj = ${JSON.stringify(entObj)}`);
        }
        // return the entry object
        return entObj;
    };

    function getTimestamp(entry) {
        var entarr = entry.split(' ');
        /*
            array length minus:
                -4 = Friday,
                -3 = Jan
                -2 = 22,2021
                -1 = 17:51:54

            We only need -3, -2, and -1.
        */
        var todstr = `${entarr[entarr.length - 3]} ${entarr[entarr.length - 2].replace(',',', ')} ${entarr[entarr.length - 1]}`;
        var tstamp = new Date(todstr).getTime();
        if(!logmute) log(`- getTimestamp(): ${todstr} ${tstamp}`);
        return tstamp;
    };

    function getAction(entry) {
        var actID = {
            id: -1,
            code: ''
        };
        if(logdata.actions.length > 0){
            for(let act of logdata.actions) {
                if(entry.includes(act.description) === true) {
                    actID.id   = act.actionid;
                    actID.code = act.catcode;
                    break;
                }
            }
            if(actID.id === -1) {
                actID.code = `ERROR: action not found, entry = [${entry}]`;
            }
        } else {
            actID.code = 'ERROR: no action data';
        }
        if(!logmute) log(`- getAction(): ${JSON.stringify(actID)}`);
        return actID;
    };

    var constants = require('./constants.js');

    function getActionParms(action, entry) {
        var actparms = {};
        switch(action.code) {
            case constants.NA:
// [LAN access from remote] from 73.176.4.88:55216 to 192.168.0.100:59018, Friday, Jan 22,2021 01:24:50
                if(action.id === constants.LAN_ACC) {
                    try {
                        let tmp = entry.split('] ');
                        tmp = tmp[1].split(' ');
                        let ipfrom = tmp[1].split(':');
                        let ipto   = tmp[3].split(':');
                        actparms.ip     = ipfrom[0];
                        actparms.port   = ipfrom[1];
                        actparms.toip   = ipto[0];
                        actparms.toport = ipto[1].replace(',','');
                    }
                    catch(err) {
                        actparms = Object.assign(actparms,{err:{act:action,ent:entry,msg:'getActionParms() failed try, err = ${JSON.stringify(err)}'}});
                    }
                } else {
// [UPnP set event: Public_UPNP_C3] from source 192.168.0.7, Monday, Jun 04,2018 02:59:36
                    if(action.id === constants.UPNP_EVENT) {
                        try {
                            // extract the UPnP message
                            let tmp = entry.split('] ');
                            tmp = tmp[0].split(': ');
                            actparms.message = tmp[1];
                            // extract the IP
                            tmp = entry.split(', ');
                            tmp = tmp[0].split('source ');
                            actparms.ip = tmp[1];
                        }
                        catch(err) {
                            actparms = Object.assign(actparms,{err:{act:action,ent:entry,msg:'getActionParms() failed try, err = ${JSON.stringify(err)}'}});
                        }
                    } else {
                        actparms = Object.assign(actparms,{err:{act:action,ent:entry,msg:'getActionParms() unknown action.id'}});
                    }
                }
                break;
            case constants.RA:
                actparms = parseRA(action, entry);
                break;
            case constants.RI:
                actparms = parseRI(action, entry);
                break;
            case constants.RL: {
// [DHCP IP: (192.168.0.211)] to MAC address B0:BE:76:CA:E2:F4, Friday, Jan 22,2021 02:00:57
                try {
                    let tmp = entry.split('address ');
                    tmp = tmp[1].split(', ');
                    actparms.mac = tmp[0];
                    tmp = entry.split('IP: (');
                    tmp = tmp[1].split(')] ');
                    actparms.ip = tmp[0];
                    // TODO: look up IP in the known table, if found 
                    // check the watch flag. if true then update 
                    // the ip stats table
                }
                catch(err) {
                    actparms = Object.assign(actparms,{err:{act:action,ent:entry,msg:'getActionParms() failed try, err = ${JSON.stringify(err)}'}});
                }
                break;
            }
            case constants.RU: {
// [Initialized, firmware version: V1.0.1.52_1.0.36] Friday, Oct 30,2020 15:27:37
                let tmp = entry.split('] ');
                tmp = tmp[0].split('version: ');
                actparms.message = tmp[1];
                break;
            }
            default:
                actparms = Object.assign(actparms,{err:{act:action,ent:entry,msg:'getActionParms() unknown action.code'}});
                break;
        };
        return actparms;
    };

    function parseRA(action, entry) {
        var raparms = {};
        // 
        switch(action.id) {
            case constants.ADM_LOG: {
// [Admin login] from source 192.168.0.7, Wednesday, Jan 13,2021 10:10:14
                let tmp = entry.split(', ');
                tmp = tmp[0].split('source ');
                raparms.ip = tmp[1];
                break;
            }
            case constants.DYN_DNS: {
// [Dynamic DNS] host name its.worse-than.tv registration successful, Friday, Jan 22,2021 15:20:46
                let tmp = entry.split(' ');
                raparms.host = tmp[4];
                break;
            }
            case constants.INET_CONN: {
// [Internet connected] IP address: 73.176.4.88, Friday, Jan 22,2021 17:51:54
                let tmp = entry.split(', ');
                tmp = tmp[0].split(': ');
                raparms.ip = tmp[1];
                break;
            }
            case constants.TIME_SYNC:
// [Time synchronized with NTP server] Friday, Jan 22,2021 17:51:56
            case constants.INET_DCONN: {
// [Internet disconnected] Thursday, Nov 07,2019 20:20:00
                let tmp = entry.split('] ');
                tmp = tmp[0].split('[');
                raparms.message = tmp[1];
                break;
            }
//            case constants.TIME_SYNC:
//// [Time synchronized with NTP server] Friday, Jan 22,2021 17:51:56
//                raparms.message = 
//                break;

            default:
                raparms = Object.assign(raparms,{err:{act:action,ent:entry,msg:'parseRA() unknown action.code'}});
                break;
        };
        return raparms;
    };

    function parseRI(action, entry) {
        var riparms = {};
        // 
        switch(action.id) {
            case constants.DOS_ATT: {
// [DoS attack: FIN Scan] (3) attack packets in last 20 sec from ip [162.214.100.81], Wednesday, Jan 20,2021 08:51:46
// [DoS attack: ACK Scan] (1) attack packets in last 20 sec from ip [106.70.232.86], Sunday, Jan 03,2021 04:48:17
                let tmp = entry.split('],');
                tmp = tmp[0].split('ip [');
                riparms.ip = tmp[1];
                tmp = entry.split('] ');
                tmp = tmp[0].split(': ');
                riparms.message = tmp[1]; 
                tmp = entry.split('] ');
                tmp = tmp[1].split(', ');
                riparms.message += ': '; 
                riparms.message += tmp[0]; 
                break;
            }
            case constants.WLAN_REJ: {
// [WLAN access rejected: incorrect security] from MAC 18:B4:30:06:D4:7E, Wednesday, Jan 13,2021 18:08:36
                let tmp = entry.split('MAC ');
                tmp = tmp[1].split(', ');
                riparms.mac = tmp[0].replace(',','');;
                tmp = entry.split('] ');
                tmp = tmp[0].split(': ');
                riparms.message = tmp[1]; 
                break;
            }
            default:
                riparms = Object.assign(riparms,{err:{act:action,ent:entry,msg:'parseRI() unknown action.code'}});
                break;
        };
        return riparms;
    };

    //////////////////////////////////////////////////////////////////////////
    // 
    function readTable(dbtable, destarr) {
        if(!logmute) log(`- readTable(): dbtable = ${dbtable}`);
        dbobj.readAllRows(dbtable, (table, result) => {
            if(result !== null) {
                result.forEach((row, idx) => {
                    destarr.push(JSON.parse(JSON.stringify(row)));
                    if(!logmute) log(`- readTable(): destarr - ${JSON.stringify(row)}`);
                });
                pevts.emit('DATA_READY', dbtable);
            } else {
                log(`- readTable(): ERROR result is null for ${table}`);
            }
        });
    };

    // read the actions table from the database and populate
    // an array of action objects
    function readActions() {
        var dbtable = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_ACTIONS_IDX]}`;
        // clear the array, could set the length to zero 
        // but this is explcit
        logdata.actions = [];
        // read the database and save the data
        readTable(dbtable, logdata.actions);
    };

    // read the action category table from the database and populate
    // an array of action category objects
    function readActionCats() {
        var dbtable = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_ACTIONCATS_IDX]}`;
        logdata.actioncats = [];
        readTable(dbtable, logdata.actioncats);
    };

    // read the known table from the database and populate
    // an array of known objects
    function readKnown() {
        var dbtable = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_KNOWN_IDX]}`;
        logdata.known = [];
        readTable(dbtable, logdata.known);
    };

    // read the IP category table from the database and populate
    // an array of IP category objects
    function readIPCats() {
        var dbtable = `${dbcfg.parms.database}.${dbcfg.tables[dbcfg.TABLE_IPCATS_IDX]}`;
        logdata.ipcats = [];
        readTable(dbtable, logdata.ipcats);
    };

    // clear the local copies of the data tables
    function clearTables() {
        logdata.actions = [];
        logdata.actioncats = [];
        logdata.known = [];
        logdata.ipcats = [];
    }

    return logdata;
});

