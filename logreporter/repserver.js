'use strict';
/*
*/
module.exports = (function(_pevts, _log)  {

    const procs_evts = _pevts;

    var dbopen = false;

    // disable(mute) some log() calls
    const logmute = true;
    // enable/disable all logging in this module
    const logenable = true;
    // set up run-time logging
    const scriptName = require('path').basename(__filename);
    function log(payload) {
        if(logenable) _log(`${scriptName} - ${payload}`);
    };

    const http = require('http');
    const url = require('url');
    const srv_port = 8080;

    let repserver = {
    };

    let server = {};

    repserver.start = function() {
        server = http.createServer(handleRequest);
        // Starts the server.
        server.listen(srv_port, function() {
            log(`Server is listening on PORT: ${srv_port}`);
        });
    };

    function readResp(report = null, res = null) {
        if(report) {
            if(!logmute) log(`report response: ${report}`);
            else log(`report response is ${report.length} bytes`);
            res.writeHead(200);
            res.end(report);
        } else {
            if(res) {
                log('report response: not found');
                res.writeHead(204);
                res.end();
            } else {
                log('FATAL ERROR res is null');
                process.exit(1);
            }
        }
    };
    
    /*
        GET http://server/rep=[report ID]

        where "report ID" is the identifying name given 
        to the SQL file that retrieves the data, 
    */
    function handleRequest(req, res) {
        if(req.method === 'GET') {
                let urlParts = url.parse(req.url, true);
                let urlQuery = urlParts.query;
                let reportid = urlQuery.rep;

                if(reportid) {
                    if(dbopen === true) {
                        log(`report request - ${reportid}`);
                        procs_evts.emit('REPORTREQ', reportid, readResp, res);
                    } else {
                        log(`falied report request, database not open - ${reportid}`);
                        res.writeHead(204);
                        res.end();
                    }
                } else {
                    log('missing params in GET');
                    res.writeHead(400);
                    res.end();
                }
        } else {
            // GET only!
            res.writeHead(405);
            res.end();
        }
    };

    procs_evts.on('DB_OPEN', (_dbobj) => {
        if(_dbobj.state === true) {
            dbopen = true;
        } else {
            log(`DB_OPEN: ERROR ${_dbobj.db.err.message}`);
        }
    });

    procs_evts.on('DB_CLOSED', (_dbobj) => {
        dbopen = false;
    });

    return repserver;
});

