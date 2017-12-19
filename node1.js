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
	site_path:__dirname + '/site'
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

var cert_folder = '/var/cert/';
pkg.fs.exists(cert_folder, function(exists) {
    if (exists) {
	pkg.fs.readdir(cert_folder, function(err, cert_files) {
		console.log(cert_folder);
	});
	//----------- SSL Certificate ----------
		var certs = {
			"qalet.com": {
				key: pkg.fs.readFileSync('/var/cert/www_qalet_com_key.pem'),
				cert: pkg.fs.readFileSync('/var/cert/www_qalet_com_crt.pem') 
			},  		
			"www.qalet.com": {
				key: pkg.fs.readFileSync('/var/cert/www_qalet_com_key.pem'),
				cert: pkg.fs.readFileSync('/var/cert/www_qalet_com_crt.pem') 
			},
			"cdn.qalet.com": {
				key: pkg.fs.readFileSync('/var/cert/cdn_qalet_com_key.pem'),
				cert: pkg.fs.readFileSync('/var/cert/cdn_qalet_com_crt.pem') 
			},			
			"_default": {
				key: pkg.fs.readFileSync('/var/cert/cdn_qalet_com_key.pem'),
				cert: pkg.fs.readFileSync('/var/cert/cdn_qalet_com_crt.pem') 
			} 
		};

		var httpsOptions = {

			SNICallback: function(hostname, cb) {
			  if (certs[hostname]) {
				var ctx = tls.createSecureContext(certs[hostname]);
			  } else {
				var ctx = tls.createSecureContext(certs['_default'])
			  }
			  cb(null, ctx)
			}

		};

	var https_server =  require('https').createServer(httpsOptions, app);
	https_server.listen(443, function() {
			console.log('Started server on port 443 at' + new Date() + '');
	});

    }
});
