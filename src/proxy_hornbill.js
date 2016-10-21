var http = require('http'),
	url = require('url'),
	path = require('path'),
	querystring = require('querystring'),
	config = require('../config/config.json')

var _serve = require('../lib/_serve.js')
var mem_data = require('../lib/_mem_data.js')

function onRequest(req, res) {
	var reqUrl = req.url
	if ('/favicon.ico' == reqUrl || '/*hello*' == reqUrl) {
		return res.end('Hello')
	}

	var reqHost = req.headers.host

	mem_data.get_host(reqHost, function(err, source) {
		if (!err) {
			var httpProxy = getProxy(source, req, res)
			req.pipe(httpProxy)
		} else {
			console.log('get url ' + reqHost + 'err: ', err)
			res.end('hornbill is sleeping')
		}
	})
}


function getProxy(source, req, res) {
	var backTimeoutTTL = 20000
	var options = {
		host: source.ip,
		port: source.port,
		headers: req.headers,
		path: req.url,
		agent: false,
		method: req.method
	}

	var request_timer
	var httpProxy = http.request(options, function(response) {
		if (request_timer) clearTimeout(request_timer)
		res.writeHead(response.statusCode, response.headers)
		response.setEncoding('utf8')
		response.pipe(res)
	})
	httpProxy.on('error', function(e) {
		res.end('error happend at :[' + req.url + ']' + e)
	})
	request_timer = setTimeout(function() {

		var now_time = new Date()
		var err_time = now_time.toLocaleTimeString() + ' ' + now_time.toLocaleDateString();
		console.log('request timeout [%s] %s' + err_time, req.headers.host, req.url)

		httpProxy.abort()
		res.end('request timeout :' + req.url)
	}, backTimeoutTTL)
	return httpProxy
}

_serve.listen(onRequest, config.server_port)
console.log('new proxy start... ')
