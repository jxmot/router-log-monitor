/*
    Log Entry Table: 

    Contains the parsed log entries, the use of columns 
    is determined by the type of log entry.


    Use the following after deleting all data:

    alter table rlmonitor.logentry auto_increment = 1;

    It will "reset" the auto increment.
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

-- identical to rlmonitor.logentry
create table rlmonitor.logentry_bad (
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
