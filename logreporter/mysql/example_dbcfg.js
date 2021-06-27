'use strict';
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
        // add your info and save this file as 
        // "_dbcfg.js"
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
        'attacktypes',
        'macvendors',
        // dynamic data tables 
        'logentry',
        'logentry_bad',
        'ipstats',
        'lanaccess',
        'attacks',
        'wlanrejects',
        'dhcpip'
    ],
    // static data table indices
    TABLE_STATIC_BEGIN: 0,
    TABLE_ACTIONS_IDX: 0,
    TABLE_ACTIONCATS_IDX: 1,
    TABLE_IPCATS_IDX: 2,
    TABLE_KNOWN_IDX: 3,
    TABLE_ATYPES_IDX: 4,
    TABLE_MACVEND_IDX: 5,
    TABLE_STATIC_END: 5,
    // dynamic data table indices
    TABLE_LOGENTRY_IDX: 6,
    TABLE_LOGENTRYBAD_IDX: 7,
    TABLE_IPSTATS_IDX: 8,
    TABLE_LANACCESS_IDX: 9,
    TABLE_ATTACKS_IDX: 10,
    TABLE_WLANREJS_IDX: 11,
    TABLE_DHCPIP_IDX: 12
};

