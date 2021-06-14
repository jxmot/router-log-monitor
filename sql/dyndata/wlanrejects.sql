/*
    Wireless LAN Rejections - All WiFi access 
    rejection events
*/
create table rlmonitor.wlanrejects (
    tstamp bigint(16) not null, 
    -- NOTE: 'unique' should prevent duplication,
    -- since this field is copied from logentry
    entrynumb bigint(16) unique not null,
    mac varchar(20) not null,
    message varchar(128) not null,
    -- some MACs/IPs might be known
    known boolean default false,
    knownip varchar(40) default null,
    -- get the device name if known
    device varchar(64) default null,
    -- only if knownip is false
    macmfr varchar(128) default null,
    -- temporary?
    logfile varchar(64) default null,
    logentry varchar(512) default null
);
