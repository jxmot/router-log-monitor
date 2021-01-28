/* ************************************************************************ */
module.exports = (function(_log) {
    // Public Data
    database = {
        // database open/closed status
        dbopen: false,
        // Initially for debugging, other purposes?
        threadid: 0
    };
    // MySQL Package - https://www.npmjs.com/package/mysql
    const mysql  = require('mysql');
    // Connection Settings, Table Names, SQL Column Definitions reference objects
    const dbcfg = require('./_dbcfg.js');
    // Initial Table Data
    var dbdata;
    // SQL Statement Parts
    var sql;
    // The Connection
    var connection;
    // A connection for Initialization
    var initconn;
    // A row counter used during initialization
    var initRowCount;
    // For logging, defaults to console.log()
//    var log = console.log;
//    /* ******************************************************************** */
//    /*
//        Optionally change where log output goes.
//    */
//    database.setLog = function(newLog){
//        if(newLog !== undefined) log = newLog;
//        else log = console.log;
//    };
    
    // set up run-time logging
    var path = require('path');
    var scriptName = path.basename(__filename);
    function log(payload) {
        _log(`${scriptName} ${payload}`);
    };



    /*
        Open the Connection to the Database

        Usage: Where "db-parms.js" contains the the required module described
        above.

            var database = require('./database-mysql.js').database;
            database.openDB('./db-parms.js', dbOpened);

            function dbOpened(isOpen, errorObject) {
                // success if true
                if(isOpen) doSomething();
                // else the errorObject will be present and contain
                // details
            };
    */
    database.openDB = function(callme, callonerror = undefined) {
        // for reporting errors to the client
        var errObj;
        // we'll call this when we're done
        let _openCallBack = callme;
        // if already open, then disconnect
        if(database.dbopen === true) {
            connection.destroy();
            database.dbopen   = false;
            database.threadid = 0;
        }
        // connect to the database...
        connection = mysql.createConnection(dbcfg.parms);

        // handle errors like when the server closes the
        // connection, can occur during development when
        // no sensor data is being collected for a period
        // of time. if this isn't done the connection will
        // close and the app will throw an exception and
        // crash.
        if(callonerror !== undefined) 
            connection.on('error', (callonerror));
        else
            connection.on('error', (dbRunTimeError));

        connection.connect(function(error) {
            if(error) {
                errObj = {
                    parms: dbcfg.parms,
                    err: {
                        message: error.message,
                        code: error.code,
                        errno: error.errno
                    }
                };
                log(`database.openDB() - ERROR connect: [${error.message}  ${error.code}  ${error.errno}]`);
                _openCallBack(database.dbopen, errObj);
            } else {
                database.dbopen   = true;
                database.threadid = connection.threadId;
                _openCallBack(database.dbopen, null);
            }
        });
    };

    /*
        Close the Connection to the Database
    */
    database.closeDB = function(callme) {
        let _closeCallBack = callme;
        connection.end(function(error) {
            if(error) log(`database.closeDB() - ERROR end: [${error.message}  ${error.code}  ${error.errno}]`);
            // The connection is terminated now 
            database.dbopen   = false;
            database.threadid = 0;
            _closeCallBack();
        });
    };

    /*
        Write a Row to the Database

        Usage:
    
            database.writeRow(table, record, callback);

            function callback(id) {
                if(id > 0) success();
                else fail();
            };

        Where:

        "record" is an object that contains a single row of data. Its
        property names must match the column names in the table that has been
        previously opened.

        An indication of success or failure is passed to the call back as an 
        argument - 

            < 0 is failure
            > 0 success, and value is the id of the new row

    */
    database.writeRow = function(table, record, callme) {
        let _writeCallBack = callme;
        if(this.dbopen === true) {
            connection.query('insert into '+table+' set ?', record, function(error, result) {
                if(error) {
                    log(`database.writeRow() - ERROR query: [${error.message}  ${error.code}  ${error.errno}]`);
                    _writeCallBack(false, table, record);
                } else _writeCallBack(true, table, record);
            });
        } else {
            log('database.writeRow() - ERROR database not open');
            _writeCallBack(false, table, record);
        }
    };

    /*
        Update a specified row.

        Where:

        "record" is an object that contains a single row of data. Its
        property names must match the column names in the table that has been
        previously opened.

        "callme" is for a required call back function. An indication of
        success or failure is passed to the call back as an argument - 

            < 0 is failure
            > 0 success, and value is the quantity of changed rows

    */
    database.updateRows = function(table, record, keyfield, callme, callmeData) {
        let _updateCallBack = callme;
        let _updateCallBackData = callmeData;
        if(this.dbopen === true) {
            connection.query('update '+table+' set ? where '+keyfield, record, function(error, result) {
                if(error) {
                    log(`database.updateRows() - ERROR query: [${error.message}  ${error.code}  ${error.errno}]`);
                    _updateCallBack(table, -1, _updateCallBackData);
                } else {
                    log(`database.updateRows() - SUCCESS - message = ${result.message}`);
                    _updateCallBack(table, result.changedRows, _updateCallBackData);
                }
            });
        } else {
            log('database.updateRows() - ERROR database not open');
            _updateCallBack(table, -1, _updateCallBackData);
        }
    };

    /*
        Read All Rows from the Database

        Usage: 

            database.readAllRows(table, dataReady);

            function dataReady(dataRows) {
                if(dataRows === undefined) {
                    console.log('dataReady() - no data available');
                } else {
                    console.log('dataReady() - data found: ');
                    console.log(dataRows);
                }
            };
    */
    database.readAllRows = function(table, callme) {
        let _readCallBack = callme;
        if(this.dbopen === true) {
            connection.query('select * from '+table, function(error, result) {
                if(error) {
                    log(`database.readAllRows() - ERROR query: [${error.message}  ${error.code}  ${error.errno}]`);
                    this.dbopen = false;
                    _readCallBack(table, null);
                } else _readCallBack(table, result);
            });
        } else {
            log('database.readAllRows() - ERROR database not open');
            _readCallBack(table, null);
        }
    };

    /*
        Read a specific row from a Table
    */
    database.readRows = function(table, keyfield, callme) {
        let _readCallBack = callme;
        if(this.dbopen === true) {

            log('database.readRows() - sql = select * from '+table+' where '+keyfield);

            connection.query('select * from '+table+' where '+keyfield, function(error, result) {
                if(error) {
                    log(`database.readRows() - ERROR query: [${error.message}  ${error.code}  ${error.errno}]`);
                    _readCallBack(table, null, {err:true, msg:'ERROR query: [${error.message}  ${error.code}  ${error.errno}]'});
                } else {
                    if((result[0] !== null) && (result[0] !== undefined)) _readCallBack(table, JSON.parse(JSON.stringify(result)));
                    else _readCallBack(table, null, {err:true, msg:'not found', key:keyfield});
                }
            });
        } else {
            log('database.readRows() - ERROR database not open');
            _readCallBack(table, null, {err:true, msg:'database not open', key:keyfield});
        }
    };

    /*
        Delete a Row from a Table
    */
    database.deleteRow = function(table, keyfield, callme) {
        let _deleteCallBack = callme;
        if(this.dbopen === true) {
            connection.query('delete from '+table+' where '+keyfield, function(error, result) {
                if(error) {
                    log(`database.deleteRow() - ERROR query: [${error.message}  ${error.code}  ${error.errno}]`);
                    _deleteCallBack(table, false, 0);
                } else _deleteCallBack(table, true, result.affectedRows);
            });
        } else {
            log('database.deleteRow() - ERROR - database not open');
            _deleteCallBack(table, false, 0);
        }
    };

    /*
        Count ALL Rows in a Table
    */
    database.countAllRows = function(table, col, callme) {
        let _countCallBack = callme;
        if(this.dbopen === true) {
            connection.query('select count('+col+') as total from '+table, function(error, result) {
                if(error) {
                    log(`database.countAllRows() - ERROR query: [${error.message}  ${error.code}  ${error.errno}]`);
                    _countCallBack(table, col, -1);
                } else {
                    _countCallBack(table, col, result);
                }
            });
        } else {
            log('database.countAllRows() - ERROR - database not open');
            _countCallBack(table, col, -1);
        }
    };

    database.countRows = function(table, col, keyfield, callme) {
        let _countCallBack = callme;
        if(this.dbopen === true) {
            connection.query(`select count(${col}) as total from ${table} where ${keyfield};`, function(error, result) {
                if(error) {
                    log(`database.countRows() - ERROR query: [${error.message}  ${error.code}  ${error.errno}]`);
                    _countCallBack(table, col, -1);
                } else {
                    _countCallBack(table, col, {k:keyfield, r:result[0].total});
                }
            });
        } else {
            log('database.countRows() - ERROR - database not open');
            _countCallBack(table, col, -1);
        }
    };

    function dbRunTimeError(err) {
        log('ERROR : dbRunTimeError() err = ');
        log(err);  
    };

    log(`- init`);
    return database;
});
