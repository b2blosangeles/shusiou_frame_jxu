(function () { 
	var obj =  function (pkg, env, req, res) {
		this.load = function(cmd, spacename) {
			var me = this;
			switch(cmd) {
				case 'postCron':
					this.postCron(req.body);
					break;

				case 'removeCron':
					this.removeCron(req.body);
					break;

				case 'getCronList':
					this.getCronList();
					break;	
				case '':
					this.microService('');
					break;					
				default:
					var v = req.params[0].match(/^\/_cron\/([^\/]+)$/);
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

		
						
		
		
		this.getCronList = function() {
			var me = this;
			pkg.db.url_cron.find({}).sort({ created: -1 }).exec(function (err, docs) {
				if (!err) {
					res.send({status:'success', data:docs});
				} else {
					res.send({status:'error', error:err});
				}

			});
		};	
		
		this.postCron  = function(v) {
			var CP = new pkg.crowdProcess();
			
			if (!v['url'] || !v['schedule']) {
				var message = ((!v['url'])?'Missing url. ':'') + ((!v['schedule'])?'Missing schedule. ':'');
				res.send({status:'error', message:message});
				return true;
			}		
			
			var _f = {};			
			/*
			_f['D1'] = function(cbk) {
				pkg.db.vhost.find({ "url":v['url']}, function (err, rec) {
					cbk(rec);
				})				
			}
			*/
			
			_f['D3'] = function(cbk) {
				pkg.db.url_cron.insert({ url: v['url'],  schedule: v['schedule'], created:new Date().getTime()}, function (err, newDoc) {
					
					if (err) {
						cbk(err);
					} else {
						cbk(newDoc);
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
		

		this.removeCron = function(v) {
				pkg.db.url_cron.remove({ _id:v._id}, { multi: true }, function (err, num) {
					if (!err) {
						res.send({status:'success', data:num});
					} else {
						res.send({status:'error', error:err});
					}
				});
		};			
		
		
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
		
	};

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = obj;
	} else {
		window.gitModule = function() {
			return obj; 
		}
	}
	
})();