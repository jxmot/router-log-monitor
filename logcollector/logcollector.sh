#!/bin/sh
#
# NOTE: This file is specific to the NAS platform that I
# use. It will likely require modification to work on any
# other platform.
# 
# This command should be run as a CRON job at an interval 
# of once per day.
/usr/builtin/bin/php /volume1/NodeSrv/apps/rlmonitor/logcollector/logcollector.php
