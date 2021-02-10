/*

|catcode|description         |
|-------|--------------------|
|NA     |Network Activity    |
|RA     |Router Actions      |
|RI     |Router Invasion     |
|RL     |Router LAN Activity |
|RU     |Router Updates      |


Implemented so far:

|actionid|description                      |catcode|
|--------|---------------------------------|-------|
|11      |UPnP set event                   |NA     |
|8       |LAN access from remote           |NA     |
|1       |Admin login                      |RA     |
|4       |Dynamic DNS                      |RA     |
|6       |Internet connected               |RA     |
|7       |Internet disconnected            |RA     |
|9       |Time synchronized with NTP server|RA     |
|3       |DoS attack                       |RI     |
|10      |WLAN access rejected             |RI     |
|2       |DHCP IP                          |RL     |
|5       |Initialized, firmware version    |RU     |


Full List(?):

|description                      |implemented?|catcode|
|---------------------------------|------------|-------|
|Admin login                      |Y           |       |
|DHCP IP                          |Y           |       |
|Dynamic DNS                      |Y           |       |
|DoS attack                       |Y           |       |
|email failed                     |            |RA     |
|email sent to                    |            |RA     |
|Initialized                      |Y           |       |
|Internet connected               |Y           |       |
|Internet disconnected            |Y           |       |
|LAN access from remote           |Y           |       |
|Service blocked                  |            |RP     |
|Site allowed                     |            |RP     |
|Site blocked                     |            |RP     |
|Time synchronized with NTP server|Y           |       |
|UPnP set event                   |Y           |       |
|USB device attached              |            |RA     |
|USB device detached              |            |RA     |
|WLAN access rejected             |Y           |       |

|catcode|description         |
|-------|--------------------|
|RP     |Router Protection   |


*/
module.exports = {
    NA         : 'NA',  // Network Activity
    RA         : 'RA',  // Router Actions     
    RI         : 'RI',  // Router Invasion    
    RL         : 'RL',  // Router LAN Activity
    RU         : 'RU',  // Router Updates     
    UPNP_EVENT : 11,    // NA
    LAN_ACC    : 8,     // NA
    ADM_LOG    : 1,     // RA
    DYN_DNS    : 4,     // RA
    INET_CONN  : 6,     // RA
    INET_DCONN : 7,     // RA
    TIME_SYNC  : 9,     // RA
    DOS_ATT    : 3,     // RI
    WLAN_REJ   : 10,    // RI
    DHCP_IP    : 2,     // RL
    FIRMW_UP   : 5      // RU
};
