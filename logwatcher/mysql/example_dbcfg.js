/* ************************************************************************ */
/*
    MySQL Connection Settings & Record Definition

    For information on the contents of 'parms' see - 

        https://www.npmjs.com/package/mysql#connection-options

*/
module.exports = {
    // mysql 
    parms: {
        host     : 'localhost',
        database : 'rlmonitor',
        user     : 'db_user_name',
        password : 'db_user_password'
    },
    // the tables in our database, use tables[] and
    // the indices below to retrieve the table names
    tables : [
        // static data tables
        'actions',
        'actioncats',
        'ipcats',
        'known',
        // dynamic data tables 
        'logentry',
        'logentry_bad',
        'ipstats',
    ],
    TABLE_ACTIONS_IDX: 0,
    TABLE_ACTIONCATS_IDX: 1,
    TABLE_IPCATS_IDX: 2,
    TABLE_KNOWN_IDX: 3,
    TABLE_LOGENTRY_IDX: 4,
    TABLE_LOGENTRYBAD_IDX: 5,
    TABLE_IPSTATS_IDX: 6
};

