select * from(
    select count(mac) as wlanrej_qty,
        ROUND((cast(((max(tstamp) - min(tstamp)) / 1000) as UNSIGNED) / count(mac))) as rank,
        mac,macmfr,
        (cast(((max(tstamp) - min(tstamp)) / 1000) as UNSIGNED)) as epoch_dur, 
        floor(((max(tstamp) - min(tstamp)) / 1000) / 86400) as day_span,
        SEC_TO_TIME(cast(mod(((max(tstamp) - min(tstamp)) / 1000), 86400) as UNSIGNED)) as time_span, 
        DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%Y-%m-%d') as first_date,
        DATE_FORMAT(FROM_UNIXTIME(min(tstamp) / 1000), '%T') as first_time,
        min(entrynumb) as first_entry, 
        DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%Y-%m-%d') as last_date,
        DATE_FORMAT(FROM_UNIXTIME(max(tstamp) / 1000), '%T') as last_time,
        max(entrynumb) as last_entry
    from rlmonitor.wlanrejects where 
    known = 0 
    -- where mod
    group by mac
    order by count(mac) desc
) as tempdata 
where
-- adjust as needed
wlanrej_qty > 1
and 
-- the "rank" value is the number of seconds between events, lower means events 
-- are occuring quicker, but the wlanrej_qty value is the key. If it's a high  
-- value with a low rank number then there might be a bad actor.
rank <= 300
-- where mod
;
-- wlanrejects-lifetime.sql: returns all WLAN rejections, by MAC hits with calculated date spans
-- {
--   "wlanrej_qty": 243,
--   "rank":11,
--   "mac": "4C:82:CF:47:F0:E4",
--   "macmfr": "Dish Technologies Corp",
--   "epoch_dur": 2646,
--   "day_span": 0,
--   "time_span": "00:44:06",
--   "first_date": "2020-04-17",
--   "first_time": "19:44:08",
--   "first_entry": 53403,
--   "last_date": "2020-04-17",
--   "last_time": "20:28:14",
--   "last_entry": 53645
-- }