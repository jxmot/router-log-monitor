'use strict';
/*
*/
module.exports = (function(_pevts, _log)  {

    const pevts = _pevts;

    // disable(mute) some log() calls
    const logmute = false;
    // enable/disable all logging in this module
    const logenable = true;
    // set up run-time logging
    const scriptName = require('path').basename(__filename);
    function log(payload) {
        if(logenable) _log(`${scriptName} - ${payload}`);
    };

    let reports = {
    };

    let dbopen = false;
    let dbobj = {};
    let dbcfg = {};

    pevts.on('DB_OPEN', (_dbobj) => {
        if(_dbobj.state === true) {
            dbopen = true;
            dbobj = _dbobj.db;
            log('DB_OPEN: success');
            dbcfg = dbobj.getDBCcfg();
            // prepare for report requests(?)
        } else {
            log(`DB_OPEN: ERROR ${_dbobj.db.err.message}`);
        }
    });

    pevts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
        dbobj = {};
        // abort all reports?
    });

    pevts.on('REPORTREQ', (reportid, readResp, res) => {
        log(`REPORTREQ: reportid = ${reportid}`);
        if(dbopen = true) {
            dbobj.runSQL(`./sql/${reportid}.sql`, (data, err) => {
                if(!err) {
                    log(`REPORTREQ: data here`);

// NOTE: require() does caching of modules, info:
//      https://bambielli.com/til/2017-04-30-node-require-cache/
//
// Also using every() instead of forEach() to allow the ability
// to break the loop:
//      https://masteringjs.io/tutorials/fundamentals/foreach-break
                    Object.keys(require.cache).every( (key) => {
                        if(key.includes('reptablegen.js')) {
                            delete require.cache[key];
                            return false;
                        }
                        return true;
                    });

                    let report = require('./reptablegen.js')(reportid, data); //, pevts, _log);
                    const table = report.getReportTable();
                    readResp(table, res);
                } else readResp(null, res);
            }); 
        }
    });

    return reports;
});

