-- ***************************************************************************
create schema rlmonitor;
use rlmonitor;

create table known (
    id integer(5) auto_increment not null,
    primary key(id),
    ip varchar(40) default null,
    mac varchar(20) default null,
    device varchar(64) default null,
    devstate varchar(2) default null,
    watch boolean default false,
    catcode integer(4) default 0
);

create table ipstats (
    ip varchar(40) not null, 
    primary key(ip),
    mac varchar(20) default null,
    known boolean default false,
    actioncounts text default '[0,0,0,0,0,0,0,0,0,0,0]' 
);

------------------------------------------------------
------------------------------------------------------

create table logentry (
    tstamp bigint(16) not null, primary key (tstamp) 
    actiontype integer(3) not null,             -- enumerated actions

    ip varchar(40) default null,
    port varchar(6) default null,
    srcip varchar(40) default null,
    srcport varchar(6) default null
    host varchar(128) default null,
    mac varchar(20) default null,
    message varchar(128) default null
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
    srcip varchar(40) default null,
    srcport varchar(6) default null
);

create table updates (
    tstamp bigint(16) not null, primary key (tstamp) 
    actiontype integer(3) not null,                    -- enumerated actions

    message varchar(128) default null
);

