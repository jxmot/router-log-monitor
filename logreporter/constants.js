'use strict';
/*
    "Constants" - although not truly constant, the values 
    here are used throughout the code and remembering a 
    label is easier than remembering the value when code
    is being written.
*/
module.exports = {
    // netlog category codes and action IDs
    NA         : 'NA',  // Network Access
    RA         : 'RA',  // Router Actions     
    RI         : 'RI',  // Router Invasion    
    RL         : 'RL',  // Router LAN Activity
    RU         : 'RU',  // Router Updates   
    RP         : 'RP',  // Router Protection (not implemented)
    MIN_ACTN   : 1,     // 
    ADM_LOG    : 1,     // RA
    DHCP_IP    : 2,     // RL
    DOS_ATT    : 3,     // RI
    DYN_DNS    : 4,     // RA
    FIRMW_UP   : 5,     // RU
    INET_CONN  : 6,     // RA
    INET_DCONN : 7,     // RA
    LAN_ACC    : 8,     // NA
    TIME_SYNC  : 9,     // RA
    WLAN_REJ   : 10,    // RI
    UPNP_EVENT : 11,    // NA
    MAX_ACTN   : 11,    // 
    // DOS Attack IDs
    DOS_ATT_UNK: 1,     // Unknown  
    DOS_ATT_FIN: 2,     // FIN Scan 
    DOS_ATT_ACK: 3,     // ACK Scan 
    DOS_ATT_STM: 4,     // STORM    
    DOS_ATT_SMF: 5,     // Smurf    

    // epoch calculation contstants
    HOURS_1_MS :    3600000,
    HOURS_4_MS :   14400000,
    DAYS_1_MS  :   86400000,
    DAYS_5_MS  :  432000000,
    DAYS_10_MS :  864000000,
    DAYS_14_MS : 1209600000,
    DAYS_21_MS : 1814400000,
    DAYS_30_MS : 2592000000,
    // 30.41 days = (365 days / 12 months)
    MONTHS_1_MS: (2592000000 + 36288000)
};
