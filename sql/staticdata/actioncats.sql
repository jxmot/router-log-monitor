/* ************************************************************************* */
/*
    Router Action Categories:

    1 RA  Router Actions
    2 RI  Router Invasion
    3 RL  Router LAN Activity
    4 RU  Router Updates
    5 NA  Network Access
    6 RP  Router Protection
*/
create table rlmonitor.actioncats (
    catid integer(4) not null,
    catcode varchar(3) not null,
    description varchar(64) not null
);

insert into rlmonitor.actioncats 
(catid,catcode,description)
values
(1,"RA","Router Actions"),
(2,"RI","Router Invasion"),
(3,"RL","Router LAN Activity"),
(4,"RU","Router Updates"),
(5,"NA","Network Activity"),
(6,"RP","Router Protection");

