(function () { 
	
	var obj =  function (pkg, env, req, res, io) {

		this.send404 = function(v) {
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write(v + ' does not exist');
			res.end();		
		}	
		this.send500 = function(err) {
			res.writeHead(500, {'Content-Type': 'text/html'});
			res.write('Error! ' + err.message);
			res.end();			
		}
		this.sendPackage = function(v) {
			var me = this;
			var fn = env.root_path + '/site/files/package/' + v;
			delete require.cache[__dirname + '/qaletPackage.js'];
			var router  = require(__dirname + '/qaletPackage.js');
			var P = new router(pkg, env, req, res);						
			P.load(fn);								
		};		
		this.sendFile = function(v) {
			var me = this, fn = env.root_path + '/site/files/' + v;
			pkg.fs.exists(fn, function(exists) {
				if (exists) {
					res.sendFile(fn); 									
				} else {
					me.send404(v);					
				} 
			});				
		};
		
		this.runApi = function(v) {
			var me = this;
			var p = env.root_path + '/site/api/' + v;
			var patt = new RegExp('.js$', 'i');
			if (!patt.test(v)) {
				me.send404(v);
				return true;
			}
			
			pkg.fs.exists(p, function(exists) {
				if (exists) {
					pkg.fs.stat(p, function(err, stats) {
						 if (stats.isFile()) {
							
							try {
								delete require.cache[p];
								var taskClass = require(p);
								var entity = new taskClass(pkg, env, req, res, io);
								entity.call();
							} catch(err) {
								pkg.fs.readFile(p, 'utf8', function(err, code) {
									if (!err) {
										try {
											new Function('require', 'pkg', 'env', 'req', 'res', 'io', code)
											(require, pkg, env, req, res, io);
										} catch(err) {
											me.send500(err);
										}
									} else {
										me.send500(err);										
									}
								});								
							}		

						 } else {
							me.send404(v);									 
						 }
					});									
				} else {
					me.send404(v);						
				} 
			});	
		}		
		
		this.getServerIP = function() {
			var ifaces = require('os').networkInterfaces(), address=[];
			for (var dev in ifaces) {
				var v =  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false);
				for (var i=0; i < v.length; i++) address[address.length] = v[i].address;
			}
			return address;
		};		
		this.isIp(ip) {
			return true;
			/*
		    var arrIp = ip.split(".");
		    if (arrIp.length !== 4) return "Invalid IP";
		    for (let oct of arrIp) {
			if ( isNaN(oct) || Number(oct) < 0 || Number(oct) > 255)
			    return false;
		    }
		    return true;
		    */
		};
		this.whoami() {
			var this = me;
			var host = req.headers.host, ips = me.getServerIP();
			if (me.isIp(host) && ips.indexOf(host) !== -1) {
			    pkg.fs.readFile('/var/whoami.data', 'utf8', function(err,data) {
			    	res.send(data);  	
			   
			    });	
				/*
			    pkg.fs.writeFile('/var/whoami.data', host, function() {
			      	
			    });*/
			}
		//	res.send(JSON.stringify(ips));
		}
		this.load = function() {
			var me = this, p = req.params[0];
			var patt = new RegExp('/(api|checkip|package)/(.+|)', 'i');
			var v = p.match(patt);
			if ((v) && typeof v == 'object') {
				switch (v[1]) {
					case 'api':
						me.runApi(v[2]);
						break;
					case 'checkip':
						me.whoami();
						break;	
					case 'package':
						me.sendPackage(v[2]);
						break;						
					default:
						me.send404(p);
				}		
			} else {
				if (p.match(/\/$/i)) {
					p+='index.html';
				}				
				me.sendFile(p);
			}
		};	
	
	};
	
	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = obj;
	} 
	
})();
