var Memcached = require('memcached')
var host_data = require('../lib/_host_data.js')
var config = require('../config/config.json')

var memcached = new Memcached(config.server_ip + ':' + config.memcached_port)
var cache_lifetime = config.memcached_time

/*
 * get data form:
		{
			id: 68,
			ip: '192.168.168.178',
			host: 'qy.fedevot.xxx.com',
			ukey: '10:dd:b1:d6:95:d0',
			port: '6010'
		}
 *
 */
var get_host = function(url, cbk) {
	var mem_url = 'forlocal_' + url.replace('.', '_')
	memcached.get(mem_url, function(err, data) {
		if (err) {
			cbk('memcached get err')
			return console.log('memcached get err: ' + err)
		}

		if (data) {
			// console.log('read memcached data: ' + data.ip);
			cbk('', data)
		} else {
			var hostsEvent = host_data.read_host({
				'host': url
			})
			hostsEvent.on('end', function(source) {
				// console.log('read sql data')
				if (source[0]) {
					memcached.set(mem_url, source[0], cache_lifetime, function(err, data) {
						if (data) {
							console.log('cached [' + url + ']')
						} else {
							console.log('cached err: ', err)
						}
					})
					cbk('', source[0])
				} else {
					cbk('can not find data by ' + url)
				}
			})
		}
	})
}

/*
 * replace data must be:
		{
			id: 68,
			ip: '192.168.168.178',
			host: 'qy.fedevot.xxxx.com',
			ukey: '10:dd:b1:d6:95:d0',
			port: '6010'
		}
 *
 */
var replace_host = function(url, data) {
	var mem_url = 'forlocal_' + url.replace('.', '_')
	memcached.replace(mem_url, data, cache_lifetime, function(err) {
		if (err) {
			console.log('replace_host err: ', err)
		} else {
			console.log('memcached data is replaced: [' + url + ']')
		}
	})
}

var del_host = function(url) {
	var mem_url = 'forlocal_' + url.replace('.', '_')
	memcached.del(mem_url, function(err) {
		if (err) {
			console.log('del_host err: ', err)
		} else {
			console.log('memcached data del: [' + url + ']')
		}
	})
}

/* test data */

// get_host('qy.fedevot.xxxx.com', function(data){
// 	console.log('get_host data:', data.ip)
// })

// del_host('qy.fedevot.xxxx.com')

// memcached.del('forlocal_qy_fedevot_xxxx_com')

exports.get_host = get_host
exports.replace_host = replace_host
exports.del_host = del_host
