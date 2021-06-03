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
        // abort all reports
    });

    pevts.on('REPORTREQ', (reportid, readResp, res) => {
        log(`REPORTREQ: reportid = ${reportid}`);
        if(dbopen = true) {
            dbobj.runSQL(`./sql/${reportid}.sql`, (data, err) => {
                log(`REPORTREQ: data here`);
                if(!err) readResp(JSON.stringify(data), res);
                else readResp(null, res);
            });
        }



        // allow queueing?

        // or isolate with settimeout?
    });

    return reports;
});

