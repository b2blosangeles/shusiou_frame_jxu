(function () { 
	var obj =  function (pkg, env, req, res) {
		this.load = function(cmd, spacename) {
			var me = this;
			switch(cmd) {
				case 'root':
					this.root();
					break;
				case 'reboot':
					this.reboot();
					break;					
				case 'reset':
					this.reset((spacename)?spacename:'');
					break;							
				
				case 'postVhost':
					this.postVhost(req.body);
					break;
				
				case 'removeVhost':
					this.removeVhost(req.body);
					break;

				case 'loadDemo':
					this.loadDemo();
					break;
					
				case 'list':
					this.showList();
					break;	
				case '':
					this.microService('');
					break;					
				default:
					var v = req.params[0].match(/^\/_git\/([^\/]+)$/);
					if (v) {
						me.microService(v[1]);
					} else {
						me.send404(req.params[0]);
					}
			}			

		};	
		this.send404 = function(v) {
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write(v + ' does not exist');
			res.end();		
		}	

		
						
		
		
		this.showList = function() {
			var me = this;
			var CP = new pkg.crowdProcess();
			var _f = {};
			
			me.vhost(
				function(vhost) {
					for (var i = 0; i < vhost.length; i++) {
						if (vhost[i]['repository']) vhost[i]['repository'] = vhost[i]['repository'].replace(/\/\/([^\:]+):([^\@]+)/i, '//(username:password)');
						_f['D' + i] = (function(i) {
									return function(cbk){
										
										pkg.fs.exists('_microservice/'+ vhost[i]['name'], function(exists) {
											if (exists) {
												vhost[i]['ready'] = true;
												//vhost[i]['ready'] = false;
											} else {
												vhost[i]['ready'] = false;
											}
											cbk(true);
										});										
									}
									
								})(i);	
					}
					CP.serial(
						_f,
						function(data) {
							res.send(vhost);
						},
						300000
					);					
					
				}
				
			)	
		}	

		this.postVhost  = function(v) {
			
		//	res.send({status:'failur', message:'Server owner is on vacation. For security reason he hold off save function for end user. You can download code from GIT hub and setup  your own functional server.'});
		//	return true;
			
			var exec = require('child_process').exec;
			var CP = new pkg.crowdProcess();
			
			if (!v['name'] || !v['repository']) {
				var message = ((!v['name'])?'Missing name. ':'') + ((!v['repository'])?'Missing repository. ':'');
				res.send({status:'error', message:message});
				return true;
			}		
			
			var _f = {};			
			
			_f['D1'] = function(cbk) {
				pkg.db.vhost.remove({ "name":v['name']}, { multi: true }, function (err) {
					cbk(err);
				})				
			}
			_f['D2'] = function(cbk) {
				pkg.fs.exists('_microservice/'+ v.name, function(exists) {
					if (exists) {
						exec('rm -fr ' + '_microservice/'+ v.name, function(err, out, code) {
							cbk(true);
						});
					} else {
						cbk(false);
					}
				});					
			}				
			_f['D3'] = function(cbk) {
				pkg.db.vhost.insert({ name: v['name'],  domain: v['domain'],  repository:v['repository'], created:new Date()}, function (err) {
					cbk(err);
				});				
			}		

			_f['DR'] = function(cbk) {
				pkg.fs.exists('_microservice/'+ v.name, function(exists) {
					if (exists) {
						exec('cd ' + '_microservice/'+ v.name + '&& git pull', function(err, out, code) {
							var msg = out;
							cbk(msg.replace("\n", '<br>'));
						});
					} else {
						var repository = v.repository.replace(/(\:\/\/)([^\:]+)\:(.+)\@([^\@]+)$/ig, 
						function($0,$1,$2,$3,$4) {
							return $1+$2+':'+encodeURIComponent($3)+'@'+$4;
						});					
						exec('git clone ' + repository + ' ' + '_microservice/'+ v.name + '', function(err, out, code) {
							var msg =  out;
							cbk(msg.replace("\n", '<br>'));
						});
					}
				});			
			}	
			CP.serial(
				_f,
				function(data) {
					res.send({status:'success', result:data});
				},
				300000
			);				
		}	

		this.removeVhost = function(v) {
			
			var exec = require('child_process').exec;
			var CP = new pkg.crowdProcess();
			var _f = {};
			_f['D1'] = function(cbk) {
				pkg.db.vhost.remove({ _id:v._id}, { multi: true }, function (err) {
					cbk(err);
				})				
			}	
			_f['D2'] = function(cbk) {
				pkg.fs.exists('_microservice/'+ v.name, function(exists) {
					if (exists) {
						exec('rm -fr ' + '_microservice/'+ v.name, function(err, out, code) {
							cbk(true);
						});
					} else {
						cbk(false);
					}
				});					
			}			
			CP.serial(
				_f,
				function(data) {
					res.send(data);
				},
				30000
			);				
		}			
		
		this.loadDemo = function(v) {
			var exec = require('child_process').exec;			
			try {
				var CP = new pkg.crowdProcess();
			
				delete require.cache[env.root_path + '/microservice.config.json'];
				var vhost =  require(env.root_path + '/microservice.config.json');
			} catch(err) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write('err.message');
				res.end();
				return false;	
			}
			var CP = new pkg.crowdProcess();
			
			var _f = {};
			for (var i = 0; i < vhost.length; i++) {
				
				_f['D' + i] = (function(i) {
					return function(cbk){
						pkg.db.vhost.find({ "name": vhost[i]['name']}, function (err, docs) {
							if (!docs || !docs[0]) {
								vhost[i].is_demo = true;
								pkg.db.vhost.insert(vhost[i], function (err) {
									pkg.fs.exists('_microservice/'+ vhost[i]['name'], function(exists) {
										if (exists) {
											exec('cd ' + '_microservice/'+ vhost[i]['name'] + '&& git pull', function(err, out, code) {
												var msg = out;
												cbk(msg.replace("\n", '<br>'));
											});
										} else {
											
											
											var repository = vhost[i].repository.replace(/(\:\/\/)([^\:]+)\:(.+)\@([^\@]+)$/ig, 
												function($0,$1,$2,$3,$4) {
													return $1+$2+':'+encodeURIComponent($3)+'@'+$4;
												});											
											
											exec('git clone ' + repository + ' ' + '_microservice/'+ vhost[i]['name'] + '', function(err, out, code) {
												var msg =  out;
												cbk(msg.replace("\n", '<br>'));
											});
										}
									});										
								});			
							} else {
								cbk(true);
							}
						});		
					}
					
				})(i);
			}
				
			CP.serial(
				_f,
				function(data) {
					pkg.db.vhost.find({}).sort({ created: -1 }).exec(function (err, docs) {
						if (!err) {
							res.send(docs)
						} else {
							res.send(err)
						}
						
					});
				},
				3000000
			);				
		}		
		
		this.vhost = function(callback) {
			var exec = require('child_process').exec;
			var CP = new pkg.crowdProcess();

			if (!env.vhost_cnt)  env.vhost_cnt = 1;
			var _f = {};
			_f['E'] = function(cbk) {
				if (env.vhost_cnt > 100) {
					pkg.db.vhost.persistence.persistCachedDatabase(function() {
						cbk(false);
					});	
					env.vhost_cnt = 1;
				} else {
					env.vhost_cnt++;
					cbk(false);
				}
			};	
				
			CP.serial(
				_f,
				function(data) {
					pkg.db.vhost.find({}).sort({ created: -1 }).exec(function (err, docs) {
						if (!err) {
							callback(docs)
						} else {
							callback(err)
						}
						
					});
				},
				300000
			);			

			return true;
		
		}	
		this.microService = function(v) {
			var me = this;
			me.vhost(
				function(vhost) {
					me.gitPull(vhost, v)
				}
				
			)
			
		}	
		this.gitPull = function(vhost, v) {
			var exec = require('child_process').exec;
			var CP = new pkg.crowdProcess();
			var _f = {};
			
			if (!v) {
				_f['S_root'] = function(cbk) {
					exec('git pull', function(err, out, code) {
						var msg = '<b>Updated root repository</b>:<br>' + out;
						cbk(msg.replace("\n", '<br>'));
					});
				}				
				
			}

			
			for (var i = 0; i < vhost.length; i++) {
				if (!v || v == vhost[i].name) {
					_f['S' + i] = (function(i) {
						return function(cbk) {
							pkg.fs.exists('_microservice/'+ vhost[i].name, function(exists) {
								if (exists) {
									exec('cd ' + '_microservice/'+ vhost[i].name + '&& git pull', function(err, out, code) {
										var msg = '<b>Updated ' + vhost[i].name + ' repository</b>:<br>' + out;
										cbk(msg.replace("\n", '<br>'));
									});
								} else {
									var repository = vhost[i].repository.replace(/(\:\/\/)([^\:]+)\:(.+)\@([^\@]+)$/ig, 
										function($0,$1,$2,$3,$4) {
											return $1+$2+':'+encodeURIComponent($3)+'@'+$4;
										});

									exec('git clone ' + repository + ' ' + '_microservice/'+ vhost[i].name + '', function(err, out, code) {
										var msg = '<b>Clone ' +  vhost[i].name + ' repository</b>:<br>' + out;
										cbk(msg.replace("\n", '<br>'));
									});
								}
							});				
						};

					})(i);
				}
			}
			
			CP.serial(
				_f,
				function(data) {
					var s = '';
					
					s += ((data.results['S_root']) ? data.results['S_root'] : '')+'  ';
					
					for (var i = 0; i < vhost.length; i++) {
						s += ((data.results['S'+i]) ? data.results['S'+i] : '')+'  ';
					}	
					res.writeHead(200, {'Content-Type': 'text/html'});
					res.write(s);
					res.write('<hr>Done!');
					res.end();
				},
				500000
			);
		}
		this.reset = function(v) {
			var me = this;
			var exec = require('child_process').exec;
			exec('rm -fr _microservice', function(err, out, code) {
				me.microService('');
			});				
		}		
		this.root = function() {
			var exec = require('child_process').exec;
			console.log(reboot);
			exec('git pull ', function(err, out, code) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write('Root repository updated:<br/>');
				res.write(out.replace("\n", '<br>'));
				res.end();									
			});				
		}
		this.reboot = function() {
			var exec = require('child_process').exec;
			exec('shutdown -r +1', function(err, out, code) {});	
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write('<br/>Server will reboot in one minute. ');
			res.end();			
		
		}		
	};

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = obj;
	} else {
		window.gitModule = function() {
			return obj; 
		}
	}
	
})();