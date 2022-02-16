/*

*/
create table rlmonitor.attacks (
    tstamp bigint(16) not null, 
    -- NOTE: 'unique' should prevent duplication,
    -- since this field is copied from logentry
    entrynumb bigint(16) unique not null,
    -- entry data...
    ip varchar(40) not null,
    -- parsed from rlmonitor.logentry->message
    attackcode varchar(40) not null,
    attackid int(4) not null,
    qty int(4) not null,
    sec int(4) not null,
    -- some IPs might be known
    known boolean default false,
    -- filled in with a 2nd pass on the row, read & update
    hostname varchar(128) default null,
-- temporary!
    message varchar(128) default null,
-- temporary?
    logfile varchar(64) default null,
    logentry varchar(512) default null
);
