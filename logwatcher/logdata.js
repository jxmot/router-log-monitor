/*
    logdata.js - this is where the log file will be parsed
    and written to the detabase
*/
module.exports = (function(pevts, _log)  {
    
    logdata = {
    };

    // needed for fs.watch(), fs.statSync(), and
    // fs.accessSync()
    var fs = require('fs');

    // set up run-time logging
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    };

    var dbopen = false;
    var dbobj = {};

    pevts.on('DB_OPEN', (_dbobj) => {
        if(_dbobj.state === true) {
            dbopen = true;
            dbobj = _dbobj.db;
            log(`- DB_OPEN: success`);
            readActions();
            readActionCats();
            readKnown();
        } else {
            log(`- DB_OPEN: ERROR ${_dbobj.db.err.message}`);
        }
    });

    pevts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
        dbobj = {};
        clearTables();
    });

    log(`- init`);

    logdata.process = function(wfile) {
        if(dbopen === false) {
            log(`- process(): database not open`);
            dbobj = {};
        } else {
            // parse the log data and write to database...
            log(`- process(): ${wfile.path}${wfile.filename}`);
            logToDB(wfile);
            // announce completion...
            console.log("LOG_PROCESSED DONE DONE DONE\n");
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
    };

    function logToDB(wfile) {
        // make sure the file is valid
        if(wfile !== undefined) {
            try {
                fs.accessSync(`${wfile.path}${wfile.filename}`, fs.constants.F_OK);
            } catch(err) {
                if(err.code === 'ENOENT') {
                    log(` - logToDB(): does not exist: ${wfile.path}${wfile.filename}`);
                    // emit error?
                }
                return;
            }
            // valid, open and read it 
            // https://nodejs.org/docs/latest-v12.x/api/fs.html#fs_fs_opensync_path_flags_mode
            var fd = fs.openSync(wfile.path+wfile.filename, 'r');
            var buff = Buffer.alloc(wfile.size);
            var rdqty = fs.readSync(fd, buff);
            fs.closeSync(fd);
            if(rdqty === wfile.size) {
                // body string to array of lines
                var logstr = buff.toString();
                var logarr = logstr.split("\n");
                // interate through array of lines - 
                //      parse each line into object
                //      write object to db
                //      next line
                logarr.forEach((entry, idx) => {
                    var newrow = parseEntry(entry, idx);
                    dbobj.writeRow('rlmonitor.logentry', newrow, (result, target, data) => {
                        if(result === true) {
                            log(`logToDB(): success - ${target} ${JSON.stringify(data)}`);
                        } else {
                            log(`logToDB(): FAIL - ${target} ${JSON.stringify(data)}`);
                        }
                    });
                });
            }
        } else {
            log(`logToDB(): undefined - wfile`);
        }
    };

    function parseEntry(_entry, idx) {
        var tmp    = _entry.replace("\n",'');
        var entry  = tmp.replace("\r",'');

        var entObj = new LogEntry;

        // build the fields and add them to the entry object
        entObj.tstamp = getTimestamp(entry);
        // get the action identifiers
        var actn = getAction(entry);
        entObj.actionid = actn.id
        // 
        var parms = getActionParms(actn, entry);
        // 
        entObj = Object.assign(entObj, parms);
        // return the entry object
        log(`parseEntry(): entObj = ${JSON.stringify(entObj)}`);
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
        log(`getTimestamp(): ${todstr} ${tstamp}`);
        return tstamp;
    };

    function getAction(entry) {
        var actID = {
            id: -1,
            code: ''
        };
        if(actions.length > 0){
            for(let act of actions) {
                if(entry.includes(act.description) === true) {
                    actID.id   = act.actionid;
                    actID.code = act.catcode;
                    break;
                }
            }
        }
        log(`getAction(): ${JSON.stringify(actID)}`);
        return actID;
    };

    var constants = require('./constants.js');

    function getActionParms(action, entry) {
        var actparms = {};
        switch(action.code) {
            case constants.NA:
// [LAN access from remote] from 73.176.4.88:55216 to 192.168.0.100:59018, Friday, Jan 22,2021 01:24:50
                var tmp = entry.split('] ');
                tmp = tmp[1].split(' ');
                var ipfrom = tmp[1].split(':');
                var ipto   = tmp[3].split(':');
                actparms.ip     = ipfrom[0];
                actparms.port   = ipfrom[1];
                actparms.toip   = ipto[0];
                actparms.toport = ipto[1].replace(',','');
                break;
            case constants.RA:
                actparms = parseRA(action, entry);
                break;
            case constants.RI:
                actparms = parseRI(action, entry);
                break;
            case constants.RL:
// [DHCP IP: (192.168.0.211)] to MAC address B0:BE:76:CA:E2:F4, Friday, Jan 22,2021 02:00:57
                var tmp = entry.split('address ');
                tmp = tmp[1].split(', ');
                actparms.mac = tmp[0];
                var tmp = entry.split('IP: (');
                tmp = tmp[1].split(')] ');
                actparms.ip = tmp[0];
                // TODO: look up IP in the known table, if found 
                // check the watch flag. if true then update 
                // the ip stats table
                break;
            case constants.RU:
// [Initialized, firmware version: V1.0.1.52_1.0.36] Friday, Oct 30,2020 15:27:37
                var tmp = entry.split('] ');
                tmp = tmp[0].split('version: ');
                actparms.message = tmp[1];
                break;

            default:
                break;
        };
        return actparms;
    };

    function parseRA(action, entry) {
        var raparms = {};
        // 
        switch(action.id) {
            case constants.ADM_LOG:
// [Admin login] from source 192.168.0.7, Wednesday, Jan 13,2021 10:10:14
                var tmp = entry.split(', ');
                tmp = tmp[0].split('source ');
                raparms.ip = tmp[1].replace(',','');
                break;
            case constants.DYN_DNS:
// [Dynamic DNS] host name its.worse-than.tv registration successful, Friday, Jan 22,2021 15:20:46
                var tmp = entry.split(' ');
                raparms.host = tmp[4];
                break;
            case constants.INET_CONN:
// [Internet connected] IP address: 73.176.4.88, Friday, Jan 22,2021 17:51:54
                var tmp = entry.split(', ');
                tmp = tmp[0].split(': ');
                raparms.ip = tmp[1].replace(',','');
                break;
            case constants.INET_DCONN:
// [Internet disconnected] Thursday, Nov 07,2019 20:20:00
                break;
            case constants.TIME_SYNC:
// [Time synchronized with NTP server] Friday, Jan 22,2021 17:51:56
                break;

            default:
                break;
        };
        return raparms;
    };

    function parseRI(action, entry) {
        var riparms = {};
        // 
        switch(action.id) {
            case constants.DOS_FIN:
            case constants.DOS_ACK:
// [DoS attack: FIN Scan] (3) attack packets in last 20 sec from ip [162.214.100.81], Wednesday, Jan 20,2021 08:51:46
// [DoS attack: ACK Scan] (1) attack packets in last 20 sec from ip [106.70.232.86], Sunday, Jan 03,2021 04:48:17
                var tmp = entry.split('],');
                tmp = tmp[0].split('ip [');
                riparms.ip = tmp[1];
                break;
            case constants.WLAN_REJ:
// [WLAN access rejected: incorrect security] from MAC 18:B4:30:06:D4:7E, Wednesday, Jan 13,2021 18:08:36
                var tmp = entry.split('MAC ');
                tmp = tmp[1].split(', ');
                riparms.mac = tmp[0].replace(',','');;
                break;

            default:
                break;
        };
        return riparms;
    };

    //////////////////////////////////////////////////////////////////////////
    // read the actions table from the database and populate
    // an array of action objects
    var actions = [];

    function readActions() {
        dbobj.readAllRows('rlmonitor.actions', (table, result) => {
            actions = [];
            if(result !== null) {
                result.forEach((row, idx) => {
                    actions.push(JSON.parse(JSON.stringify(row)));
                    //log(`readActions(): a action - ${JSON.stringify(row)}`);
                });
            } else {
                log(`readActions(): ERROR result is null`);
            }
        });
    };

    // read the action category table from the database and populate
    // an array of action category objects
    var actioncats = [];

    function readActionCats() {
        dbobj.readAllRows('rlmonitor.actioncats', (table, result) => {
            actioncats = [];
            if(result !== null) {
                result.forEach((row, idx) => {
                    actioncats.push(JSON.parse(JSON.stringify(row)));
                    //log(`readActionCats(): a actioncat - ${JSON.stringify(row)}`);
                });
            } else {
                log(`readActionCats(): ERROR result is null`);
            }
        });
    };

    // read the known table from the database and populate
    // an array of known objects
    var known = [];

    function readKnown() {
        dbobj.readAllRows('rlmonitor.known', (table, result) => {
            known = [];
            if(result !== null) {
                result.forEach((row, idx) => {
                    known.push(JSON.parse(JSON.stringify(row)));
                    //log(`readKnown(): a known - ${JSON.stringify(row)}`);
                });
            } else {
                log(`readKnown(): ERROR result is null`);
            }
        });
    };

    function clearTables() {
        actions = [];
        actioncats = [];
        known = [];
    }

    return logdata;
});

