'use strict';
/*
    Log Report API Server

    Listens for GET requests having a query. The query 
    indicates which report to generate.

    GET http[s]://someserver:[port]?rep=some-report-id
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

    // start the API server...
    repserver.start = function(port = null) {
        server = http.createServer(handleRequest);
        // Starts the server.
        server.listen((port === null ? srv_port : port), function() {
            log(`Server is listening on PORT: ${(port === null ? srv_port : port)}`);
        });
    };

    // callback for returning request responses
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
        GET http://server:port?rep=[report ID]

        where "report ID" is the identifying name given 
        to the SQL file that retrieves the data, 
    */
    function handleRequest(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        if(req.method === 'GET') {
            let urlParts = url.parse(req.url, true);
            let urlQuery = urlParts.query;
            let reportid = urlQuery.rep;
            // did we get a report ID?
            if(reportid) {
                // yes, make sure the database is ready
                if(dbopen === true) {
                    log(`report request - ${reportid}`);
                    procs_evts.emit('REPORTREQ', reportid, readResp, res);
                } else {
                    log(`falied report request, database not open - ${reportid}`);
                    res.writeHead(204);
                    res.end();
                }
            } else {
                if(req.url.includes('favicon')) {
                    log('GET favicon, sent 404');
                    res.writeHead(404);
                } else {
                    log('missing params in GET');
                    res.writeHead(400);
                }
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

