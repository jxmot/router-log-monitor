SELECT count(knownip) as dhcp_qty,
    device,
    knownip,givenip,
    errip,
    -- common report columns
    (cast(((max(tstamp) - min(tstamp)) / 1000) as UNSIGNED)) as epoch_dur, 
    floor(((max(tstamp) - min(tstamp)) / 1000) / 86400) as day_span,
	SEC_TO_TIME(cast(mod(((max(tstamp) - min(tstamp)) / 1000), 86400) as UNSIGNED)) as time_span, 
    DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%Y/%m/%d') as first_date,
    DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%T') as first_time,
    min(entrynumb) as first_entry, 
    DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%Y/%m/%d') as last_date,
    DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%T') as last_time,
    max(entrynumb) as last_entry
FROM rlmonitor.dhcpip
-- where mod
group by knownip 
order by count(knownip) desc;
-- dhcpip-lifetime.sql : returns all dhcpip, by known IP hits with calculated date spans
--      {
--        "dhcp_qty": 179,
--        "device": "Some device on the network(from the 'known' table)",
--        "knownip": "192.168.0.233",
--        "givenip": "192.168.0.233",
--        "errip: : 0,
--        "epoch_dur": 204,
--        "day_span": 0,
--        "time_span": "00:03:24",
--        "first_event": "2018-10-09 @ 10:04:58",
--        "first_entry": 8671,
--        "last_event": "2018-10-09 @ 10:08:22",
--        "last_entry": 8849
--      }
