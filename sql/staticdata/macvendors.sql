/*  
    MAC Vendor Information:

    Contains MAC information obtained via the API provided 
    by https://maclookup.app

    Rate Limits:
        https://maclookup.app/api-v2/rate-limits

    API Documentation
        https://maclookup.app/api-v2/documentation

    Sample API Response:
        {
        "success": true,
        "found": true,
        "macPrefix": "4C82CF",
        "company": "Dish Technologies Corp",
        "address": "94 Inverness Terrace E, Englewood CO 80112, US",
        "country": "US",
        "blockStart": "4C82CF000000",
        "blockEnd": "4C82CFFFFFFF",
        "blockSize": 16777215,
        "blockType": "MA-L",
        "updated": "2017-10-11",
        "isRand": false,
        "isPrivate": false
        }
*/
create table rlmonitor.macvendors (
    -- these columns are copied from the 
    -- API response
    macPrefix varchar(12) unique not null,
    company varchar(128) default null,
    address varchar(256) default null,
    country varchar(4) default null,
    updated varchar(16) default null,
    -- columns filled in programatically:
    --      when this data was updated
    updatedStamp bigint(16) default null,
    -- date of addition to db table
    dbsaved varchar(16) default null,
    dbsavedStamp bigint(16) default null
);

/*
    Seed data for testing
*/
insert into rlmonitor.macvendors 
(macPrefix,company,address,country,updated,updatedStamp,dbsaved,dbsavedStamp)
values
("DDEEFF","Sputz Intnl","5000 Sputz Way\nMiami, FL","US","2019-07-12",1562907600000,"2021-04-28",1619630222000),
("BEEF00","Bovine Electronics","2121 Cow Ave\nBaldwin, WI","US","2020-03-05",1583388000000,"2021-03-15",1615799822000),
("AABBCC","ACME Inc","1234 13th St.\nChicago, IL","US","2017-10-11",1507698000000,"2021-11-22",1606079822000);
