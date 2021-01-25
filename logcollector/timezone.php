<?php
/*
    Timezone functions

    tzone() - returns the configured timezone

    iptzone($ip) - returns the timezone for the given IP

    zonetime($fmt, $time = null, $ip = null) - returns the time in the
    desired format, if $ip is present it returns the current time
    for the zone of the IP. if $time is present then that is used
    instead of the current time.

*/
function tzone() {
    $tmp = json_decode(file_get_contents('./tzone.json'));
    return $tmp->tz;
}

function iptzone($ip) {
    // https://ip-api.com/docs/api:json
    $tmp = json_decode(file_get_contents('http://ip-api.com/json/'.$ip.'?fields=status,message,timezone'));
    if($tmp->status === 'success') {
        return $tmp->timezone;
    } else {
        return tzone();
    }
}

function zonetime($fmt, $time = null, $ip = null) {
    $dt = new DateTime();
    $tz = null;
    if($ip === null) {
        $tz = tzone();
    } else {
        $tz = iptzone($ip);
    }
    $dt->setTimezone(new DateTimeZone($tz));
    if($time === null) $time = time();
    $dt->setTimestamp($time);
    return $dt->format($fmt);
}
?>