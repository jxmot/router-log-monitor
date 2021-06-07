# Log Watcher

This is part of the Router Log Monitor. And it is responsible for - 

* Reading and parsing log files
  * Writes parsed entries to database tables
* 

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

From those log entries it's possible to extract the pieces needed for the database:

* Time stamp of the entry
* Which type *action* is the entry describing
* Other pieces of information that describe the *action*

FIrst, the router's activities were categorized:


|     Category       |Category Code| 
|    Description     |  (catcode)  | 
|--------------------|-------------|
|Network Activity    |      NA     | 
|Router Actions      |      RA     | 
|Router Invasion     |      RI     | 
|Router LAN Activity |      RL     | 
|Router Updates      |      RU     | 


<br>






|catcode|actionid|description                      |
|-------|--------|---------------------------------|
|NA     |11      |UPnP set event                   |
|NA     |8       |LAN access from remote           |
|RA     |1       |Admin login                      |
|RA     |4       |Dynamic DNS                      |
|RA     |6       |Internet connected               |
|RA     |7       |Internet disconnected            |
|RA     |9       |Time synchronized with NTP server|
|RI     |3       |DoS attack                       |
|RI     |10      |WLAN access rejected             |
|RL     |2       |DHCP IP                          |
|RU     |5       |Initialized, firmware version    |

<br>

| Action ID|       Action Description        |Implemented |Category Code|
|  actnid  |       Action Description        |     Y/N    |   catcode   |
|----------|---------------------------------|------------|-------------|
|     1    |Admin login                      |      Y     |      RA     |
|     2    |DHCP IP                          |      Y     |      RL     |
|     3    |DoS attack                       |      Y     |      RI     |
|     4    |Dynamic DNS                      |      Y     |      RA     |
|          |email failed                     |            |      RA     |
|          |email sent to                    |            |      RA     |
|     5    |Initialized                      |      Y     |      RU     |
|     6    |Internet connected               |      Y     |      RA     |
|     7    |Internet disconnected            |      Y     |      RA     |
|     8    |LAN access from remote           |      Y     |      NA     |
|          |Service blocked                  |            |      RP     |
|          |Site allowed                     |            |      RP     |
|          |Site blocked                     |            |      RP     |
|     9    |Time synchronized with NTP server|      Y     |      RA     |
|    10    |UPnP set event                   |      Y     |      NA     |
|          |USB device attached              |            |      RA     |
|          |USB device detached              |            |      RA     |
|    11    |WLAN access rejected             |      Y     |      RI     |
<br>

|catcode|description         |
|-------|--------------------|
|RP     |Router Protection   |


<br>


### Event Usage

### "Static" Data

### Database Report Tables



## Running the Application

### Configuration

### "watch" VS "read"


