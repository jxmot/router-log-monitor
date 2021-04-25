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
-- there can be duplicate time stamps for individual log 
-- entries. The event TODs in the logs are measured in 
-- seconds but can be separated in time by milliseconds.
--    primary key (tstamp),

    -- NOTE: 'unique' should prevent duplication,
    -- since this field is copied from logentry
    entrynumb bigint(16) unique not null,

    ip varchar(40) not null,
    port varchar(6) not null,
    toip varchar(40) not null,
    toport varchar(6) not null,
    -- filled in with a 2nd pass, read & update
    hostname varchar(128) default null,

-- temporary
    logfile varchar(64) default null,
    logentry varchar(512) default null
);


-- 1 Unknown    Cannot parse attack
-- 2 FIN Scan   FIN packet received
-- 3 ACK Scan   ACK packet received
-- 4 STORM      STORM Attack
-- 5 Smurf      SMURF Attack
create table rlmonitor.attacktypes (
    attackid integer(4) not null,
    attackcode varchar(32) not null,
    description varchar(64) default null,
);

-- FIN Scan: (1) attack packets in last 20 sec from ip [151.101.65.69]
-- ACK Scan: (1) attack packets in last 20 sec from ip [151.101.65.69]
-- STORM: (1) attack packets in last 20 sec from ip [151.101.65.69]
-- Smurf: (1) attack packets in last 20 sec from ip [151.101.65.69]

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
    -- filled in with a 2nd pass, read & update
    hostname varchar(128) default null,
-- temporary!
    message varchar(128) default null,
-- temporary?
    logfile varchar(64) default null,
    logentry varchar(512) default null
);


create table rlmonitor.wlanrejs (
    tstamp bigint(16) not null, 
    -- NOTE: 'unique' should prevent duplication,
    -- since this field is copied from logentry
    entrynumb bigint(16) unique not null,
    mac varchar(20) not null,
    message varchar(128) not null,
    ip varchar(40) not null,
    -- some MACs/IPs might be known
    known boolean default false,
    -- temporary?
    logfile varchar(64) default null,
    logentry varchar(512) default null
);

--------------------------------------------------------

--                VS.

--------------------------------------------------------

-- 
create table actions (
    tstamp bigint(16) not null, 
    -- primary key (tstamp),

    -- NOTE: 'unique' should prevent duplication,
    -- since this field is copied from logentry
    entrynumb bigint(16) unique not null,

    actionid integer(3) not null,

    ip varchar(40) default null,
    -- result of lookup
    host varchar(128) default null,
    message varchar(128) default null
);

-- A
create table lanactivity (
    tstamp bigint(16) not null, 
    -- primary key (tstamp),

    actionid integer(3) not null,

    ip varchar(40) default null,
    mac varchar(20) default null--,
--    message varchar(128) default null
);

create table netactivity (
    tstamp bigint(16) not null, 
    -- primary key (tstamp),

    actionid integer(3) not null,

    ip varchar(40) default null,
    port varchar(6) default null,
    toip  varchar(40) default null,
    toport  varchar(6) default null
);

create table updates (
    tstamp bigint(16) not null, 
    -- primary key (tstamp),

    actionid integer(3) not null,

    message varchar(128) default null
);

