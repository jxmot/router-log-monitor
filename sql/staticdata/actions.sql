/* ************************************************************************* */
/*
    Router Actions:

    RA Admin login
    RL DHCP IP
    RI Invasions(attacks) : FIN Scan, ACK Scan, STORM, Smurf
    RA Dynamic DNS
    RU Initialized, firmware version
    RA Internet connected
    RA Internet disconnected
    NA LAN access from remote
    RA Time synchronized with NTP server
    RI WLAN access rejected
    NA UPnP set event
    RI Self2WAN ICMP type b Detected!
*/
create table rlmonitor.actions (
    actionid integer(4) not null,
    description varchar(64) not null,
    catcode varchar(3) not null
);

insert into rlmonitor.actions 
(actionid,description,catcode)
values
 (1,"Admin login","RA"),
 (2,"DHCP IP","RL"),
 (3,"DoS attack","RI"),
 (4,"Dynamic DNS","RA"),
 (5,"Initialized, firmware version","RU"),
 (6,"Internet connected","RA"),
 (7,"Internet disconnected","RA"),
 (8,"LAN access from remote","NA"),
 (9,"Time synchronized with NTP server","RA"),
(10,"WLAN access rejected","RI"),
(11,"UPnP set event","NA"),
(12,"Self2WAN ICMP type b Detected!","RI");

