const http = require('http');
const request = require('request');
const cheerio = require('cheerio');
const path = require('path');
const URL = require('url');
const argv = require('yargs').argv;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const protocol = argv.nosecure ? 'http://' : 'https://';
const fqdn = argv._[0] || undefined;
const port = 9615;

if (fqdn === undefined) {
	console.log("Exiting... Must supply a fully-qualified domain name.");
	process.exit(1);
}

var response = '';

http.createServer(function (req, res) {
	if (req.url.indexOf('robots.txt') > -1) {
		res.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
		res.end('User-agent: *\n');
	} else {
		var $,
			head,
			urlObj,
			url;

		urlObj = URL.parse(req.url);
		url = protocol + path.join(fqdn, urlObj.path);

		console.log('Requesting...', url);

		request(url, function(err, resp, body){
				if (!err && resp.statusCode == 200) {
					$ = cheerio.load(body);
					$head = $('head');
					$$head = cheerio.load('<html><head></head></html>')('head');
					$$head.append($head.find('title'));
					$$head.append($head.find('meta'));
					$$head.append($head.find('link'));
					$$head.append($head.find('script[type="application/ld+json"]'));
					res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
					res.end('<!doctype html><html><head>' + $$head.html() + '</head><body><h1>Hi!</h1></body></html>');
				} else {
					console.log(err);
					res.writeHead(404, {'Content-Type': 'text/html;charset=UTF-8'});
					res.end();
				}
			});
	}
}).listen(port);

console.log('Listening at 0.0.0.0:' + port);
console.log('Proxy to', protocol + fqdn);
