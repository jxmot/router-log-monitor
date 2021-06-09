/* ************************************************************************* */
/*
    IP Address Categories:

    This table is an "extra", the intent is that this table would 
    be used in generating report tables.


    2021/06/08 - Not currently used.
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
    Example Data
*/
insert into rlmonitor.ipcats 
(id,description,inuse,iplow,iphigh)
values
( 1,"Household equipment", true ,"192.168.0.2",  "192.168.0.19" ),
( 2,"Misc IoT devices",    true ,"192.168.0.20", "192.168.0.29" ),
( 3,"unused",              false,"192.168.0.30", "192.168.0.49" );
