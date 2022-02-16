/*
    Used for "Internet connected" and "Internet disconnected".

*/
create table rlmonitor.inetconn (
    tstamp bigint(16) not null, 
    -- NOTE: 'unique' should prevent duplication,
    -- since this field is copied from logentry
    entrynumb bigint(16) unique not null,
    -- entry data...
    -- if ip is null then this is a disconnected event
    ip varchar(40) default null,
    -- temporary?
    logfile varchar(64) default null,
    logentry varchar(512) default null
);
