/* ************************************************************************* */
/*
    DOS Attack Types:

    1   Unknown    Cannot parse attack
    2   FIN Scan   FIN packet received
    3   ACK Scan   ACK packet received
    4   STORM      STORM Attack
    5   Smurf      SMURF Attack
*/
create table rlmonitor.attacktypes (
    attackid integer(4) not null,
    attackcode varchar(3) not null,
    description varchar(64) default null,
);


insert into rlmonitor.attacktypes 
(attackid,attackcode,description)
values
(1,"Unknown","Cannot parse attack"),
(2,"FIN Scan","FIN packet received"),
(3,"ACK Scan","ACK packet received"),
(4,"STORM","STORM Attack"),
(5,"Smurf","SMURF Attack");
