var cluster = require('cluster'),
	http = require('http'),
	path = require('path'),
	fs = require("fs")

var numCPUs = 2
exports.load = function(file, onChg) {
	var file = path.resolve(file)
	fs.watchFile(file, {
		persistent: true,
		interval: 10
	}, function() {
		delete require.cache[file]
		if (onChg) {
			function cbk() {
				try {
					onChg(require(file))
				} catch (err) {
					console.log('reload ' + file + ' err ' + err)
					process.nextTick(cbk)
				}
			}
			cbk()
		}
	})

	if (onChg) {
		try {
			onChg(require(file))
		} catch (err) {
			console.log('load ' + file + ' err ' + err)
			onChg(false)
		}
	}
}

exports.listen = function(onRequest, port) {
	if (cluster.isMaster) {
		for (var i = 0; i < numCPUs; i++) {
			cluster.fork();
		}
		cluster.on('exit', function(worker) {
			console.log('worker ' + worker.process.pid + ' died at:', new Date);
			cluster.fork();
		});
	} else {
		http.createServer(onRequest).listen(port)
	}

}
