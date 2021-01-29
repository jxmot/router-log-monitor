/*

|catcode|description         |
|-------|--------------------|
|NA     |Network Activity    |
|RA     |Router Actions      |
|RI     |Router Invasion     |
|RL     |Router LAN Activity |
|RU     |Router Updates      |



|actionid|description                      |catcode|
|--------|---------------------------------|-------|
|9       |LAN access from remote           |NA     |
|1       |Admin login                      |RA     |
|5       |Dynamic DNS                      |RA     |
|7       |Internet connected               |RA     |
|8       |Internet disconnected            |RA     |
|10      |Time synchronized with NTP server|RA     |
|3       |DoS attack: FIN Scan             |RI     |
|4       |DoS attack: ACK Scan             |RI     |
|11      |WLAN access rejected             |RI     |
|2       |DHCP IP                          |RL     |
|6       |Initialized, firmware version    |RU     |


*/
module.exports = {
    LAN_ACC    : 9,       // NA
    ADM_LOG    : 1,       // RA
    DYN_DNS    : 5,       // RA
    INET_CONN  : 7,       // RA
    INET_DCONN : 8,       // RA
    TIME_SYNC  : 10,      // RA
    DOS_FIN    : 3,       // RI
    DOS_ACK    : 4,       // RI
    WLAN_REJ   : 11,      // RI
    DHCP_IP    : 2,       // RL
    FIRMW_UP   : 6,       // RU
    NA         : 'NA',
    RA         : 'RA',
    RI         : 'RI',
    RL         : 'RL',
    RU         : 'RU'
};
