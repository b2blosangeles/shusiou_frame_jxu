(function () { 
	var obj =  function (pkg, env, req, res, logger) {
		this.log_list = [
			'qalet_node.log', 'qalet_cron.log'
		];

		this.load = function(cmd, spacename) {
			var me = this;
			switch(cmd) {
				case 'getHostList':
					me.getHostList();
					break;					
				case 'getDefaultLogs':
					if (logger) {
						logger.log('info', 'niu Hello distributed log files!');
					}
					me.getDefaultLogs();
					break;	
				case 'getLogs':
					if (logger) {
						logger.log('info', 'getLogs Hello distributed log files!');
					}				
					me.getLogs();
					break;						
				case 'viewLog':
					me.viewLog(req.query.file);
					break;

				case 'viewVLog':
					me.viewVLog(req.query.file);
					break;
					
				case 'cleanLog':
					me.cleanLog(req.query.file);
					break;
					
				default:
					me.send404(req.params[0]);
			}			

		};	
		this.send404 = function(v) {
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write(v + ' does not exist');
			res.end();		
		};	

		this.getDefaultLogs = function(v) {
			var me = this;
			res.send(me.log_list);
		};		

		this.getLogs = function(v) {
			var me = this;
			var v = [];
			pkg.fs.readdir( env.root_path+'/_log/', function(err, files) {
				if (err) {
					return [];
				} else {
					for (var i = 0; i < files.length; i++) {
						if ((/\.log$/i).test(files[i])) v[v.length] = files[i];
					}
					res.send(v);
				}
			});			
		};
		
		this.viewLog = function(v) {
			if (typeof v == 'undefined') {
				var v = 'qalet_node.log';
			} 
			
			var fn ='/var/log/' + v;
			
			pkg.fs.exists(fn,function(exists){
				if(exists){
					pkg.fs.readFile(fn,'utf8', function (err,data) {
						if (!err) {
							var v = data.replace(/^(\n|\r\n|\r|\t)/gm,'').replace(/^\s+(\n|\r\n|\r|\t)/gm,'').replace(/(\n|\r\n|\r|\t)/gm,'[newline]');
							res.send(v.split('[newline]'));
						} else {
							res.send(err.message);
						}
					});
				} else {
					res.send('it does not exist');
				}
			});	
		};

		this.viewVLog = function(v) {
			var fn = env.root_path+'/_log/' + v;
			
			pkg.fs.exists(fn,function(exists){
				if(exists){
					pkg.fs.readFile(fn,'utf8', function (err,data) {
						if (!err) {
							var v = data.replace(/^(\n|\r\n|\r|\t)/gm,'').replace(/^\s+(\n|\r\n|\r|\t)/gm,'').replace(/(\n|\r\n|\r|\t)/gm,'[newline]');
							res.send(v.split('[newline]'));
						} else {
							res.send(err.message);
						}
					});
				} else {
					res.send('it does not exist');
				}
			});	
		};


		this.getHostList = function() {
			var me = this;
			var cp = new pkg.crowdProcess();
			var _f = {};
			_f['S0'] = function(cbk) {
				pkg.fs.readdir( env.root_path+'/_log/', function(err, files) {
					var v = [];
					if (err) {
						return [];
					} else {
						for (var i = 0; i < files.length; i++) {
							if ((/\.log$/i).test(files[i])) v[v.length] = files[i];
						}
						cbk(v);
					}
				});	
			};
			_f['S1'] = function(cbk) {
				var files = cp.data.S0;
				pkg.db.vhost.find({domain:{$exists:true}}).sort({ created: -1 }).exec(function (err, docs) {
					if (!err) {
						var v = [{name:'default',root_files:me.log_list, files:[]}];					
						for(var i = 0; i < docs.length; i++) {
							var idx = v.length;
							v[idx] = {};
							v[idx].name = docs[i].name;
							v[idx].domain = docs[i].domain;
							v[idx].files = [];
						}	
						for(var i = 0; i < v.length; i++) {
							var ff = 'vr';
							for (var j = 0; j < files.length; j++) {
								var reg_info = new RegExp(v[i].name+'(_cron|_api|_git|)-info.log$', 'ig'),
								reg_exceptions = new RegExp(v[i].name+'(_cron|_api|_git|)-exceptions.log$', 'ig'),
								reg_error = new RegExp(v[i].name+'(_api|_cron|_git|)-error.log$', 'ig');
								if (reg_info.test(files[j]) || reg_error.test(files[j]) || reg_exceptions.test(files[j])) {		
									v[i].files[v[i].files.length] = files[j];
								}
								
							}
						}
						cbk(v);
					} else {
						cbk(err)
					}
				});				
				
			};			
			cp.serial(
				_f,
				function(data) {	
					//res.send(data);
					res.send(data.results.S1);
				},
				1000
			);
		}
		
		this.cleanLog = function(v) {
			if (typeof v == 'undefined') {
				var v = 'qalet_node.log';
			}
			pkg.exec('> /var/log/'+ v, function(error, stdout, stderr) {
				pkg.exec('> ' + env.root_path+'/_log/'+ v, function(error, stdout, stderr) {
					res.send({status:'success', message:'cleaned' + v});
				});	
			});			
			
		};		
		
	};

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = obj;
	} else {
		window.apiModule = function() {
			return obj; 
		}
	}
	
})();