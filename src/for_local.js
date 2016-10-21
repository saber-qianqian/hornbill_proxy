/*
 * todo:
		1、删除域名功能
		2、本地发来两次请求或多次请求bug
 *
 */

var url = require('url'),
	querystring = require('querystring'),
	exec = require('child_process').exec,
	util = require('util'),
	path = require('path'),
	fs = require('fs'),
	config = require('../config/config.json')

var _serve = require('../lib/_serve.js')
var host_data = require('../lib/_host_data.js')
var mem_data = require('../lib/_mem_data.js')

function getIp(req) {
	var ip = req.headers['x-forwarded-for'] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress
	return ip.replace('::ffff:', '')
}

function getHostByUkey(ukey, res) {
	console.log('getHostByUkey: ', ukey)
	var hostEvent = host_data.read_host({
		'ukey': ukey
	})
	hostEvent.on('end', function(hosts) {
		res.end(JSON.stringify(hosts))
	})
}

function onRequest(req, res) {
	res.writeHead(200, {
		'Content-Type': 'text/plain',
		'Cache-Control': 'no-cache,no-store'
	})
	var query = url.parse(req.url, true, true)

	switch (query.pathname.slice(1)) {
		case 'update':
			var ukey = query.query.ukey
			var ip = getIp(req)
			var updated = []

			var hostEvent = host_data.read_host({
				'ukey': ukey
			})
			hostEvent.on('end', function(hosts) {
				if (hosts.length) {
					hosts.forEach(function(hostData) {
						if (hostData.ip != ip) {
							updated.push({
								'host': hostData.host,
								'ip': ip,
								'port': hostData.port
							})
						}
					})
					updated.forEach(function(hostData) {
						host_data.update_host(hostData.host, hostData)

						mem_data.del_host(hostData.host)

						console.log('\ntype updata, ', hostData)

					})
					res.end(JSON.stringify({
						"updated": updated
					}))
				} else {

					console.log('mode err')

					res.end(JSON.stringify({
						err: true,
						msg: 'use [random] mode'
					}))
				}
			})
			break
		case 'ip':
			res.end(getIp(req))
			break
		case 'ukey':
			getHostByUkey(query.query.ukey, res)
			break
		case 'host':
			var q = query.query
			var host = q.host,
				port = q.port,
				ukey = q.ukey,
				rm = !!q.rm

			if (!host) return res.end('the domain you want?')
			if (!port) return res.end('your service port?')

			if (!util.isArray(host)) host = [host]
			var ip = getIp(req)
			var updated = []
			host.forEach(function(h) {
				h = h + '.' + config.dns_url
				updated.push({
					'host': h,
					'ip': ip,
					'port': port,
					'ukey': ukey
				})
			})
			updated.forEach(function(hostData) {
				var hostEvent = host_data.save_host(hostData.host, hostData)

				hostEvent.on('conflict', function(resData) {
					return res.end(resData)
				}).on('updata', function(resData) {

					console.log('\ntype host, updata, ', resData)

					mem_data.del_host(hostData.host)

					return res.end(resData)
				}).on('create', function(resData) {

					console.log('\ntype host, create, ', resData)

					return res.end(resData)
				})
			})
	}
}

var arguments = process.argv.splice(2)
_serve.listen(onRequest, arguments[0] || config.local_port)
