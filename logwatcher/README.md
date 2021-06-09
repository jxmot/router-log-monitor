# Log Watcher

This is part of the Router Log Monitor. And this part is responsible for reading and parsing log files, and Writing parsed entries to database tables.

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
<br>

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

## Running the Application

### Configuration

#### Database Tables

There are SQL statment files in the `/sql` folder and sub-folders. They should be use to create the database and tables, and create & seed the "static" data tables.

* **`/sql`**:
  * `rlmonitor.sql` - creates the schema

* **`/sql/dyndata`**:
  * `logentry.sql` - 
  * `attacks.sql` - 
  * 

* **`/sql/staticdata`**:
  * `actions.sql` - create table and seed
  * `actioncats.sql` - create table and seed
  * `ipcats.sql` - create table and seed
  * `known.sql` - create table and seed with dummy data
  * `attacktypes.sql` - create table and seed 
  * `macvendors.sql` - create table and seed with dummy data

### Shell Script Files



#### "watch" VS "read"


