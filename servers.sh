#!/bin/sh

#
# This script will be executed *after* all the other init scripts.
# You can put your own initialization stuff in here if you don't
# want to do the full Sys V style init stuff.

rf=$(pwd)'/'

stopService() {
	echo 'stop service'
	if [ ! -f $rf'pids' ]; then
		for proc in `ps -ef | grep node | grep -E 'proxy_hornbill|for_local'| awk '{print $2}'`; do
			echo $proc
			kill $proc ; done
	else
		cat $rf'pids' | while read line; do
			kill $line
		done
		rm -r $rf'pids'
	fi
}

startService() {
	for_local_logf='/tmp/log/for_local-server/'` date +%Y/%m/`
	for_local_log=$for_local_logf`date +%d`'.log'

	hornbill_proxy_logf='/tmp/log/proxy_hornbill-server/'` date +%Y/%m/`
	hobill_proxy_log=$hornbill_proxy_logf`date +%d`'.log'


	echo 'SERVICES START AT '` date +%Y/%m/%d-%T` >> $for_local_log
	echo 'SERVICES START AT '` date +%Y/%m/%d-%T` >> $hobill_proxy_log

	mkdir -p $for_local_logf
	mkdir -p $hornbill_proxy_logf


	echo 'web service start , logfile:'$for_local_log
	cd $rf && nohup node src/for_local.js >> $for_local_log &

	echo 'static service start , logfile:'$hobill_proxy_log
	cd $rf && nohup node src/proxy_hornbill.js >> $hobill_proxy_log &
}

if [ $# -eq 0 ]; then
	echo "proxy_hornbill logfile at: /tmp/log/proxy_hornbill-server/"
	echo "for_local logfile at: /tmp/log/for_local-server/"
	echo ""
	echo "you should pass args start|restart|stop"
else
	case $1 in
		"stop")
			stopService
			;;
		"start")
			startService
			;;
		"restart")
			stopService
			startService
			;;
	esac
fi

