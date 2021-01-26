-- ***************************************************************************
create schema rlmonitor;
use rlmonitor;

-- A
create table actions (
    tstamp bigint(16) not null, primary key (tstamp) 
    type integer(3) not null,                    -- enumerated actions
    ip varchar(40) default null,
    host varchar(128) default null,
    message varchar(128) default null
);

create table invasions (
    tstamp bigint(16) not null, primary key (tstamp) 
    type integer(3) not null,                    -- enumerated actions
    ip varchar(40) default null,
    mac varchar(128) default null,
    message varchar(128) default null
);

-- A
create table lanactivity (
    tstamp bigint(16) not null, primary key (tstamp) 
    type integer(3) not null,                    -- enumerated actions
    ip varchar(40) default null,
    host varchar(128) default null,
    message varchar(128) default null
);

create table netactivity (
    tstamp bigint(16) not null, primary key (tstamp) 
    type integer(3) not null,                    -- enumerated actions
    ip varchar(40) default null,
    port varchar(6) default null,
    srcip varchar(40) default null,
    srcport varchar(6) default null
);

create table updates (
    tstamp bigint(16) not null, primary key (tstamp) 
    type integer(3) not null,                    -- enumerated actions
    ip varchar(40) default null,
    message varchar(128) default null
);

