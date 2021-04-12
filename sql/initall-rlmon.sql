-- ***************************************************************************
create schema rlmonitor;
use rlmonitor;

create table rlmonitor.known (
    id integer(5) auto_increment not null,
    primary key(id),
    ip varchar(40) default null,
    mac varchar(20) default null,
    device varchar(64) default null,
    devstate varchar(2) default null,
    watch boolean default false,
    ipcat integer(4) default 0
);

/*
*/
create table rlmonitor.ipcats (
    id integer(5) auto_increment not null,
    primary key(id),
    description varchar(64) not null,
    inuse boolean default false,
    iplow varchar(40) default null,
    iphigh varchar(40) default null
);

/*
*/
create table rlmonitor.ipstats (
    ip varchar(40) not null, 
    primary key(ip),
    mac varchar(20) default null,
    actioncounts varchar(64) default '[0,0,0,0,0,0,0,0,0,0,0]',
    lastcount bigint(16) not null,
    tstamp bigint(16) not null,
    known boolean default false,
    ipid integer(5) default null
);

create table rlmonitor.actioncats (
    catid integer(4) not null,
    catcode varchar(3) not null,
    description varchar(64) not null
);

create table rlmonitor.actions (
    actionid integer(4) not null,
    description varchar(64) not null,
    catcode varchar(3) not null
);

------------------------------------------------------
------------------------------------------------------

/*
    use the following after deleting all data:

    alter table rlmonitor.logentry auto_increment = 1;
*/

create table rlmonitor.logentry (
    entrynumb bigint(16) auto_increment not null, 
    primary key (entrynumb),

    tstamp bigint(16) not null, 
    actionid integer(3) not null,
    ip varchar(40) default null,
    port varchar(6) default null,
    toip varchar(40) default null,
    toport varchar(6) default null,
    host varchar(128) default null,
    mac varchar(20) default null,
    message varchar(128) default null,
-- temporary
    logfile varchar(64) default null,
    logentry varchar(512) default null
);

create table rlmonitor.invasions (
    tstamp bigint(16) not null, 
--    primary key (tstamp),

    -- NOTE: 'unique' should prevent duplication,
    -- since this field is copied from logentry
    entrynumb bigint(16) unique not null,

    ip varchar(40) not null,
    port varchar(6) not null,
    toip varchar(40) not null,
    toport varchar(6) not null,

-- temporary
    logfile varchar(64) default null,
    logentry varchar(512) default null
);



--------------------------------------------------------

--                VS.

--------------------------------------------------------

-- 
create table actions (
    tstamp bigint(16) not null, primary key (tstamp) 
    actiontype integer(3) not null,                    -- enumerated actions

    ip varchar(40) default null,
    host varchar(128) default null,
    message varchar(128) default null
);

-- A
create table invasions (
    tstamp bigint(16) not null, primary key (tstamp) 
    actiontype integer(3) not null,                    -- enumerated actions

    ip varchar(40) default null,
    mac varchar(20) default null,
    message varchar(128) default null
);

-- A
create table lanactivity (
    tstamp bigint(16) not null, primary key (tstamp) 
    actiontype integer(3) not null,                    -- enumerated actions

    ip varchar(40) default null,
    mac varchar(20) default null--,
--    message varchar(128) default null
);

create table netactivity (
    tstamp bigint(16) not null, primary key (tstamp) 
    actiontype integer(3) not null,                    -- enumerated actions

    ip varchar(40) default null,
    port varchar(6) default null,
    toip  varchar(40) default null,
    toport  varchar(6) default null
);

create table updates (
    tstamp bigint(16) not null, primary key (tstamp) 
    actiontype integer(3) not null,                    -- enumerated actions

    message varchar(128) default null
);

