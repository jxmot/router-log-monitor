# Log Watcher

This is part of the Router Log Monitor. And this part is responsible for reading & parsing log files, and writing the parsed entries to database tables.

## Log Watcher Architecture Overview

<p align="center">
  <img src="./mdimg/logwatcher-overview.png" alt="Log Watcher Overview Diagram" txt="Log Watcher Overview Diagram" width="60%">
</p>

## Design Details Overview



### Anatomy of a Log Entry

The logging provided by the Netgear N6400 is not the best, or the worst. And I'm sure that when the original engineer designed it they had no intent of it being parsed. 

Here is a sample of some typical log entries:

```
[DHCP IP: (10.100.0.3)] to MAC address BE:EF:D0:0D:00:12, Friday, May 07,2021 00:21:49
[LAN access from remote] from 11.22.33.123:40216 to 10.100.0.100:59018, Friday, May 07,2021 00:37:22
[Dynamic DNS] host name someserver.com registration successful, Friday, May 07,2021 16:42:41
[Internet connected] IP address: 1.22.33.123, Friday, May 07,2021 17:04:30
[Time synchronized with NTP server] Friday, May 07,2021 17:04:31
[WLAN access rejected: incorrect security] from MAC 0D:DB:EE:F0:F7:52, Saturday, May 08,2021 08:40:17
[Admin login] from source 10.100.0.3, Tuesday, Apr 27,2021 04:12:23
[DoS attack: FIN Scan] (1) attack packets in last 20 sec from ip [151.101.186.133], Monday, Apr 26,2021 11:20:24
[DoS attack: STORM] (1) attack packets in last 20 sec from ip [68.86.184.146], Wednesday, Jan 01,2020 00:07:27
```

From those log entries it's possible to extract the pieces needed for the database. I wanted to be sure that there was sufficient details so that meaningful queries could be ran on the data.

Here are the parts I needed to parse from a log entry:

* Time stamp of the entry
* Which type *action* is the entry describing?
* Other pieces of information that describe the *action*

First I needed to *categorize* the types of *actions* that the router could take:

|    Description     |Category Code| 
|--------------------|:-----------:|
|Network Access      |      NA     | 
|Router Actions      |      RA     | 
|Router Invasion     |      RI     | 
|Router LAN Activity |      RL     | 
|Router Updates      |      RU     | 
|*Router Protection* |      RP     |
<p>(Table 1 - Action Categories)</p>
<br>

**NOTE**: The category *Router Protection* and its actions have not been implemented.

<br>

Then I looked at the possible *actions*, listed them and assigned them to a category:

|Category Code|      Action Description         |
|:-----------:|---------------------------------|
|      NA     |UPnP set event                   |
|      NA     |LAN access from remote           |
|-------------|---------------------------------|
|      RA     |Admin login                      |
|      RA     |Dynamic DNS                      |
|      RA     |Internet connected               |
|      RA     |Internet disconnected            |
|      RA     |Time synchronized with NTP server|
|-------------|---------------------------------|
|      RI     |DoS attack                       |
|      RI     |WLAN access rejected             |
|-------------|---------------------------------|
|      RL     |DHCP IP                          |
|-------------|---------------------------------|
|      RU     |Initialized, firmware version    |
|-------------|---------------------------------|
<p>(Table 2 - Router Actions)</p>
<br>

**NOTE**: *Router Protection*  has not been implemented yet.

<br>

This is what has been implemented *so far*:

|       Action Description        |Implemented?|Category Code|
|---------------------------------|:----------:|:-----------:|
|Admin login                      |      Y     |      RA     |
|DHCP IP                          |      Y     |      RL     |
|DoS attack                       |      Y     |      RI     |
|Dynamic DNS                      |      Y     |      RA     |
|email failed                     |            |      RA     |
|email sent to                    |            |      RA     |
|Initialized                      |      Y     |      RU     |
|Internet connected               |      Y     |      RA     |
|Internet disconnected            |      Y     |      RA     |
|LAN access from remote           |      Y     |      NA     |
|Log Cleared                      |            |      RA     |
|Self2WAN ICMP type b Detected!   |            |      RI     |
|Service blocked                  |            |      RP     |
|Site allowed                     |            |      RP     |
|Site blocked                     |            |      RP     |
|Time synchronized with NTP server|      Y     |      RA     |
|UPnP set event                   |      Y     |      NA     |
|USB device attached              |            |      RA     |
|USB device detached              |            |      RA     |
|WLAN access rejected             |      Y     |      RI     |
<p>(Table 3 - Implemented Actions)</p>

### Event Usage

This application uses two *event emitters*. One for the events needed for log file watching & reading, and another for synchronizing other application operations like:

* The database connection is opened or closed
* Resources and data ready for use
* Data saved to database

### "Static" Data

Actually, "static" is just the term I'm using to describe data that is retrieved from the database and does not change during the application's run-time. The only exception is the MAC vendor database which can be updated during run-time.

The majority of that data is used in the parsing of log entries. It's also used when generating the report tables for MAC lookups and event classifications.

Here are the "static" data tables in the `rlmonitor` database:

* `actioncats` - "Action Categories" as described above in "Table 1"
* `actions` - "Router Actions" as described in "Table 2"
* `ipcats` - This table contains IP address categories that I have assigned to the equipment on my network. Each "IP Category" is assigned an ID, description, and the IP range.
* `known` - All of the "known" devices attached to my network, this includes a description, MAC, and "IP Category".
* `attacktypes` - Different types of DOS attacks. 
* `macvendors` - This table contains MAC vendor information that was obtained via an API.

### Database Report Tables

For detailed information regarding the layout of the tables see THISDOCHERE.

* `logentry` - all parsed log entries
* `logentry_bad` - any log entry that could not be parsed

After a log file has been parsed, the following tables are populated with log entries that match the tables' criteria:

* `attacks` - all DOS attacks
* `lanaccess` - all LAN access from outside the local network
* `dhcpip` - all DHCP events
* `wlanrejects` - Wireless LAN access failures

## Running the Application

### Configuration

**`runlogopt.js`**

This configures the run-time logging. See the NPM package [simple-text-log](<https://www.npmjs.com/package/simple-text-log>) for details.

```
'use strict';
module.exports = {
    logfile:'./logs/logwatcher.log',
    // 10 MiB file size, then roll over & archive
    logsize:10485760
};
```

**`watchopt.js`**

Option settings for the `logwatcher` applciation:

<details><summary>
See File Contents
</summary>
<p>

```
'use strict';
// options and settings for logwatch.js and logread.js
module.exports = {
    path : './../logoutput/',
    // log file names are: YYYYMMDD-HHMMSS-net.log
    // NOTE: the "net.log" portion must match the 
    // 'outfile' setting in ../logcollector/appoptions.json
    nameregexp: /^\d{8}-\d{6}-net\.log/g,
    copybad : true,
    mintstamp: 1523771032000,
    delbad: true,
    // used in logread.js, readdel has 
    // priority over readmov and readren,
    // and readmov has priority over readren
    readdel: false,
    readmov: true,
    // NOTE: this is relative to "path", so things
    // like "../folder/" will work. If the path does
    // not exist it will be created. This will be
    // added to 'path'.
    movpath: 'oldlogs/',
    // rename the file(s), renchar can be a string
    // instead of a single character. It is added 
    // to the start of the file name.
    readren: false,
    renchar: '_',
    // only used in logread.js, leave set to 'true' 
    // the 'false' setting is for debug purposes
    readexit: true
};
```
</p>
</details>

For handling unparsable ("bad") log entries the following options are available:

* `copybad` - when `true` bad entries are copied into a separate database table for later examination
* `delbad` - when `true` bad entries are deleted from the log entry table.

| Bad Log Entry Disposition  |copybad| delbad|
|----------------------------|:-----:|:-----:|
| Copy to "bad entry" table  | true  | false |
| Copy & Delete              | true  |  true |
| Leave "bad entry" in table | false | false |
<p>(Table 4 - Bad Log Entry Disposition)</p>

**NOTE**: Each time a log entry is parsed an "entry sequence number" is created and saved with that entry, including "bad" log entries. This means that if bad entries are 
deleted then there will be a gap in the sequence numbers found in the log entry table. This is intentional, and can be used for detecting router logging problems.

After the log file is read and parsed there are options to determine how that file will be handled further:


|        Operation         |readdel|readmov|readren|
|--------------------------|:-----:|:-----:|:-----:|
| Leave file "as is"       | false | false | false |
| Delete File              |  true |  N/A  |  N/A  |
| Move file into `movpath` | false |  true |  N/A  |
| Rename file              | false | false |  true |
<p>(Table 5 - Log File Handling Options)</p>

* "Move file into `movpath`" - The destination path is `path`+`movpath`
* "Rename file" - The filename is prepended with the character (or string) in `rechar` and the log file is left in its current location 

**`macinfocfg.js`**

<details><summary>
See File Contents
</summary>
<p>

```
// macinfocfg.js - configuration for MAC manufacturer 
// look ups.
// 
// NOTE: You will need to get your own API key, place 
// in a file - ./keys/_maclookupapp.key
// 
module.exports = {
    // https://maclookup.app/
    hostname: 'api.maclookup.app',
    // for developer refernce, as named on maclookup.app
    apikeyName: 'rlmonitor',
    // API key
    apikey: `${require('fs').readFileSync('./keys/_maclookupapp.key')}`,
    // part of the URL
    urlparts : [
        '/v2/macs/',
        '?apiKey='
    ],
    // Let's be "nice"...
    useragent: 'rlmonitor application https://github.com/jxmot/router-log-monitor',
    headeraccept: 'application/json',
    // save when the API returns?
    savemac: true
};
```
</p>
</details>

**`example_dbcfg.js`**

<details><summary>
See File Contents
</summary>
<p>
```
'use strict';
/* ************************************************************************ */
/*
    MySQL Connection Settings & Record Definition

    For information on the contents of 'parms' see - 

        https://www.npmjs.com/package/mysql#connection-options

*/
module.exports = {
    // mysql 
    parms: {
        host     : 'localhost',
        database : 'rlmonitor',
        // add your info and save this file as 
        // "_dbcfg.js"
        user     : 'db_user_name',
        password : 'db_user_password'
    },
    // the tables in our database, use tables[] and
    // the indices below to retrieve the table names
    tables : [
        // static data tables
        'actions',
        'actioncats',
        'ipcats',
        'known',
        'attacktypes',
        'macvendors',
        // dynamic data tables 
        'logentry',
        'logentry_bad',
        'ipstats',
        'invasions',
        'attacks',
        'wlanrejects',
        'dhcpip'
    ],
    // static data table indices
    TABLE_STATIC_BEGIN: 0,
    TABLE_ACTIONS_IDX: 0,
    TABLE_ACTIONCATS_IDX: 1,
    TABLE_IPCATS_IDX: 2,
    TABLE_KNOWN_IDX: 3,
    TABLE_ATYPES_IDX: 4,
    TABLE_MACVEND_IDX: 5,
    TABLE_STATIC_END: 5,
    // dynamic data table indices
    TABLE_LOGENTRY_IDX: 6,
    TABLE_LOGENTRYBAD_IDX: 7,
    TABLE_IPSTATS_IDX: 8,
    TABLE_LANACCESS_IDX: 9,
    TABLE_ATTACKS_IDX: 10,
    TABLE_WLANREJS_IDX: 11,
    TABLE_DHCPIP_IDX: 12
};
```
</p>
</details>

#### Database Table Creation and Seeding

There are SQL statment files in the `/sql` folder and sub-folders. They should be use to create the database and tables, and create & seed the "static" data tables.

* **`/sql`**:
  * `rlmonitor.sql` - creates the schema

* **`/sql/dyndata`**:
  * `logentry.sql` - create table
  * `attacks.sql` - create table
  * `lanaccess.sql` -create table
  * `dhcpip.sql` - create table
  * `wlanrejects.sql` - create table

* **`/sql/staticdata`**:
  * `actions.sql` - create table and seed data
  * `actioncats.sql` - create table and seed data
  * `ipcats.sql` - create table and seed data
  * `known.sql` - create table and seed with dummy data
  * `attacktypes.sql` - create table and seed data
  * `macvendors.sql` - create table and seed with dummy data

### Shell Script Files



#### "watch" VS "read"


