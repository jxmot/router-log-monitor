/* ************************************************************************* */
/*
    Known Devices or IP Addresses:

    Aids in finding, or filtering log entries for known
    devices. 

*/
create table rlmonitor.known (
    id integer(5) auto_increment not null,
    primary key(id),
    ip varchar(40) default null,
    mac varchar(20) default null,
    device varchar(64) default null,
    -- these fields aren't used when looking up 
    -- devices by IP or MAC. They're here for
    -- future development.
    devstate varchar(2) default null,   -- device state: to be used to indicate in/out of service
    watch boolean default false,        -- watch logs for this device, trigger ???
    ipcat integer(4) default 0;         -- IP category ID 
);


insert into rlmonitor.known 
(ip,mac,device)
values
("192.10.0.9",   "AA:BB:CC:BE:EF:3C","desktop"),
("192.10.0.2",   "AA:BB:CC:BE:EF:F0","laptop"),
("192.10.0.100", "AA:BB:CC:BE:EF:56","Smart Bulb #1");
