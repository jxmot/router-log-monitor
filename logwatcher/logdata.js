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

    pevts.on('DB_OPEN', (dbobj) => {
        if(dbobj.state === true) {
            dbopen = true;
            dbobj = dbobj.db;
            log(`- DB_OPEN: success`);
        } else {
            log(`- DB_OPEN: ERROR ${dbobj.db.err.message}`);
        }
    });

    log(`- init`);

    logdata.process = function(wfile) {
        if(dbopen === false) {
            log(`- process(): database not open`);
        } else {
            // parse the log data and write to database...
            log(`- process(): ${wfile.path}${wfile.filename}`);
            logToDB(wfile);
            // announce completion...
            pevts.emit('LOG_PROCESSED', wfile);
        }
        return dbopen;
    };

    function logToDB(wfile) {
        // make sure the file is valid
        if(wfile !== undefined) {
            try {
                fs.accessSync(`${wfile.path}${wfile.filename}`, fs.constants.F_OK);
            } catch(err) {
                if(err.code === 'ENOENT') {
                    log(`logToDB(): does not exist: ${wfile.path}${wfile.filename}`);
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
                var logarr = logstr.split("\r\n");
                // interate through array of lines - 
                //      parse each line into object
                //      write object to db
                //      next line
                logarr.forEach((entry, idx) => {
                    parseEntry(entry, idx);
                });
    
                // send LOG_PROCESSED
            }
        } else {
            log(`logToDB(): undefined - wfile`);
        }
    };

    // [Internet connected] IP address: 73.176.4.88, Friday, Jan 22,2021 17:51:54
    function parseEntry(_entry, idx) {
        var tmp    = _entry.replace("\n",'')
        var entry  = tmp.replace("\r",'')
        var entarr = entry.split(' ');
        /*
            length minus:
                -5 = 73.176.4.88,
                -4 = Friday,
                -3 = Jan
                -2 = 22,2021
                -1 = 17:51:54
        */
        var todstr = `${entarr[entarr.length - 3]} ${entarr[entarr.length - 2].replace(',',', ')} ${entarr[entarr.length - 1]}`;
        var tstamp = new Date(todstr).getTime();
        log(`parseEntry(): ${todstr} ${tstamp}`);
    };

    return logdata;
});

