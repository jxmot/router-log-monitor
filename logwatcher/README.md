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

Here is a sample of log entries:

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



### Event Usage

### "Static" Data

### Database Report Tables



## Running the Application

### Configuration

### "watch" VS "read"


