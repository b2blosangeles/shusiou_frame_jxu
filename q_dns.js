var 
express = require('./package/express/node_modules/express'),   
bodyParser = require('./package/body-parser/node_modules/body-parser'),
compression = require('./package/compression/node_modules/compression'),
tls = require('tls'),  
app			= express(),
expireTime	= 604800000,
port 		= 80;

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

/* ---- DNS Server */
 fs.readFile('/var/.qalet_cron_watch.data', 'utf8', function(err,ip) {
      if (err){
          console.log(ip);
      } 
 });
	     /*
fs.exists('env.site_path + '/ddns/ddns.js', function(exists) {
    if (exists) {
	delete require.cache[env.site_path + '/ddns/ddns.js'];
	let ddns  = require(env.site_path + '/ddns/ddns.js);
	let dns = require('dns'), dnsport = 53;
    }
});
 

//dns.lookup('ns1.shusiou.win', (err, address, family) => {
	var address = '192.241.135.146';
	function getServerIP() {
	    var ifaces = require('os').networkInterfaces(), address=[];
	    for (var dev in ifaces) {
		var v =  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false);
		for (var i=0; i < v.length; i++) address[address.length] = v[i].address;
	    }
	    return address;
	};
	let ips = getServerIP();
	if (ips.indexOf(address) !== -1) {
		let dnsd = require('./package/dnsd/node_modules/dnsd');
		try {
			delete require.cache[env.site_path + '/ddns/ddns.js'];
			var ddns  = require(env.site_path + '/ddns/ddns.js);
			
			dnsd.createServer(function(req, res) {
				console.log(JSON.stringify(req.question[0].name)+'----------------------------------');
				console.log(req.connection.remoteAddress + '-' + req.connection.type);
				res.end('67.205.189.126');
			}).listen(dnsport, address)
			console.log('DNS Server running at ' + address + ':' + dnsport);
		} catch (e) {
			console.log('niu ' + address + ':' + dnsport);
		}
	} else {
		console.log('There is not a NS record associate with this IP =>');
		console.log(ips);
	}
//});
*/
/* ---- DNS Server */
