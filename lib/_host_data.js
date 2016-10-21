var orm = require('orm')
var events = require('events')
var config = require('../config/config.json')

// 读取从库
const connStr = config.mysql
// 写主库
const connStr_m = config.mysql

const hostData = {
	"id": {
		type: 'serial',
		key: true
	},
	"ip": String,
	"host": String,
	"ukey": String,
	"port": String
}

var read_host = function(filter) {
	filter = filter || {}
	var e = new events.EventEmitter()
	orm.connect(connStr, function(err, db) {
		if (err) {
			e.emit('err', err)
		} else {
			var table = db.define('hostData', hostData)
			table.find(filter, function(err, rs) {
				e.emit('end', rs)
				db.close()
			})
		}
	})
	return e
}

var create_host = function(data, cb) {
	orm.connect(connStr_m, function(err, db) {
		if (err) {
			console.log(err)
		} else {
			var table = db.define('hostData', hostData)
			table.create(data, function(err, rs) {
				cb(err, rs)
				db.close()
			})
		}
	})
}

var update_host = function(host, data) {
	orm.connect(connStr_m, function(err, db) {
		if (err) {
			console.log(err)
		} else {
			var table = db.define('hostData', hostData)
			table.one({
				host: host
			}, function(err, update_data) {
				if (err) {
					console.log(err)
				} else {
					update_data.save(data)
				}
				db.close()
			})
		}
	})
}

var save_host = function(host, data) {
	var e = new events.EventEmitter()
	orm.connect(connStr, function(err, db) {
		var table = db.define('hostData', hostData)
		table.exists({
			'host': host
		}, function(err, hostIsActive) {
			if (hostIsActive) {
				table.one({
					'host': host
				}, function(err, host_sql) {
					if (data.ukey == host_sql.ukey) {
						update_host(host, data)
							// console.log('update_data save_host')
						e.emit('updata', data.host + ' is updata ip: ' + data.ip)
					} else {
						// console.log('conflict save_host')
						e.emit('conflict', data.host + ' is occupied by ' + host_sql.ip)
					}
					db.close()
				})
			} else {
				// console.log('create_host save_host')
				create_host(data, function(res) {
					e.emit('create', data.host + ' is created: ' + JSON.stringify(data))
				})
				db.close()
			}
		})
	})
	return e
}

function data_init() {
	var bak_data = require('../test/test_host.json')
	var newData = []

	for (var host in bak_data) {
		newData.push({
			'host': host,
			'ip': bak_data[host].ip,
			'ukey': bak_data[host].ukey,
			'port': bak_data[host].port
		})
	}

	create_host(newData, function(res) {
		console.log(res)
	})
}

// test mysql
// data_init()

exports.read_host = read_host
exports.save_host = save_host
exports.create_host = create_host
exports.update_host = update_host
