/*
    Table for saving "RI" entry types: 


*/
create table rlmonitor.invasions (
    tstamp bigint(16) not null, 
-- there can be duplicate time stamps for individual log 
-- entries. The event TODs in the logs are measured in 
-- seconds but can be separated in time by milliseconds.
--    primary key (tstamp),

    -- NOTE: 'unique' should prevent duplication,
    -- since this field is copied from logentry
    entrynumb bigint(16) unique not null,

    ip varchar(40) not null,

    -- some IPs might be known
    known boolean default false,

    port varchar(6) not null,
    toip varchar(40) not null,
    toport varchar(6) not null,
    -- filled in with a 2nd pass, read & update
    hostname varchar(128) default null,

-- temporary
    logfile varchar(64) default null,
    logentry varchar(512) default null
);

