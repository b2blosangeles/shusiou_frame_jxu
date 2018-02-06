var 
express = require('./package/express/node_modules/express'),   
bodyParser = require('./package/body-parser/node_modules/body-parser'),
compression = require('./package/compression/node_modules/compression'),
tls = require('tls'),  
app			= express(),
expireTime	= 604800000,
port 		= 80,
dnsport		= 53;

var LOG = require(__dirname + '/package/log/log.js');
var log = new LOG();
		
var env = {
	root_path:__dirname,
	config_path:'/var/qalet_config',
	site_path:__dirname + '/site',
	site_contents_path:__dirname + '/site_contents'
};			
var pkg = {
	crowdProcess:require('./package/crowdProcess/crowdProcess'),
	request		:require('./package/request/node_modules/request'),
	syntaxError	:require('./package/syntax-error/node_modules/syntax-error'),
	fs		:require('fs'),
	exec		:require('child_process').exec			
};


app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(compression({level:9}));

app.all('*', function(req, res, next) {
       res.header("Access-Control-Allow-Origin", "*");
       res.header("Access-Control-Allow-Headers", "X-Requested-With");
       res.header('Access-Control-Allow-Headers', 'Content-Type');
       next();
});

app.use(function(req, res, next){
    res.setTimeout(60000, function(){
		res.writeHead(505, {'Content-Type': 'text/html'});
		var v = {
			url:req.protocol + '://' + req.get('host') + req.originalUrl,
			code: 505,
			reason:'timeout'
		}
		res.write(req.protocol + '://' + req.get('host') + req.originalUrl + ' request was timeout!');
		res.end();			
	});
    next();
});

app.get(/(.+)$/i, function (req, res) {
	delete require.cache[__dirname + '/modules/qaletRouter/qaletRouter.js'];
	var router  = require(__dirname + '/modules/qaletRouter/qaletRouter.js');
	var R = new router(pkg, env, req, res);
	R.load();
});

app.post(/(.+)$/i, function (req, res) {
	delete require.cache[__dirname + '/modules/qaletRouter/qaletRouter.js'];
	var router  = require(__dirname + '/modules/qaletRouter/qaletRouter.js');
	var R = new router(pkg, env, req, res);
	R.load();
});

function getServerIP() {
    var ifaces = require('os').networkInterfaces(), address=[];
    for (var dev in ifaces) {
        var v =  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false);
        for (var i=0; i < v.length; i++) address[address.length] = v[i].address;
    }
    return address;
};
var dnsd = require('./package/dnsd/node_modules/dnsd');
let ips = getServerIP(),
    dns = require('dns'),


dnsd_server = dnsd.createServer(function(req, res) {
  res.end('1.2.3.4')
});
dns.lookup('ns.shusiou.win', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
});
dns.lookup('ns.shusiou.win', (err, address, family) => {
  console.log(address);
});
//for (var i=0; i < ips.length; i++) {
	dnsd_server.listen(dnsport, ips[0]);
	console.log('Server running at ' + ips[0] + ':' + dnsport);
//}
console.log(getServerIP());
