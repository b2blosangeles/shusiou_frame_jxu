
var exec = require('child_process').exec;
var path = require('path'), fs = require('fs');
var env = {root_path:path.join(__dirname, '../../')};

var crowdProcess = require(env.root_path + '/package/crowdProcess/crowdProcess');

var FOLDERP =  require(env.root_path + '/api/inc/folderP/folderP.js');
var request = require(env.root_path + '/package/request/node_modules/request');

var folderP  = new FOLDERP ();
var base = '/var/video/',  base_ctl = '/var/video_ctl/'

var CP = new crowdProcess();
var _f = {};

function getServerIP() {
    var ifaces = require('os').networkInterfaces(), address=[];
    for (var dev in ifaces) {
        var v =  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false);
        for (var i=0; i < v.length; i++) address[address.length] = v[i].address;
    }
    return address;
};
function writePullLog(v, cbk) {
	fs.appendFile(base_ctl + 'pull_log.data', new Date().toString() + '::' + __dirname + '::' + v + "\n", function(err) {
		cbk();
	});
};
function writeRepLog(v, cbk) {
	fs.appendFile(base_ctl + 'rep_log.data', new Date().toString() + '::' + __dirname + '::' + v + "\n", function(err) {
		cbk();
	});
};

var FOLDER_SCAN = function () {
	var me = this;
	this.total_size = 0;
	this.master_video = {};
	this._result = {};
	
	this.scan = function(dir, code, cbk) {
	    var finder = require(env.root_path + '/api/inc/findit/findit.js')(dir);			

	    finder.on('directory', function (dir, stat, stop) {
		var base = path.basename(dir);
		me.total_size += stat.size;
	    });
	    finder.on('file', function (file, stat) {
	       var filter_master = /\/video\/video\.mp4$/;
		var patt = new RegExp('^'+ dir);
		// --- node is different than master on this comment
	//       if (filter_master.test(file)) {
	//	  me.master_video = {folder:dir, code: code, master_video:file.replace(patt,''),  size:stat.size};
	 //      }  else {
		   me.total_size += stat.size;
		  me._result[file.replace(patt,'')] = stat.size;
	   //    }
	    });
	    finder.on('link', function (link, stat) { });

	    finder.on('end', function (link, stat) {

		if (typeof cbk == 'function') {
			me.master_video['totalsize'] = me.total_size;
			cbk({master:me.master_video, list:me._result});
		}
	    });


	};
};

_f['P0'] = function (cbk) {
	folderP.build(base, function() {
		folderP.build(base_ctl, function() {
			cbk(true);
		});	
	});	
}

_f['P1_CACHE'] = function (cbk) {
	fs.readFile(base_ctl + 'report.cache', 'utf8', function (err,data) {
		var d = {};
		try {		
			d = (err)?{}:JSON.parse(data);
		} catch(err) {};
		cbk(d);
	});
}


_f['P1'] = function (cbk) {
    request({
        url: 'http://api.shusiou.com/api/cloud_resource.report',
        method: "POST",
        headers: {
		    "content-type": "application/json",
		    },
        	json: {ip:getServerIP(), lastUpdate:CP.data.P1_CACHE.lastUpdate}
        }, function (error, resp, body) {
	    //--- check api status ---
	    
	    if (body.status == 'success') {
		    if (typeof body.data == 'string') {
			    writePullLog('NoUpdate ::'+body.data, function() {
				cbk(CP.data.P1_CACHE.data);   
			    });				    
		    } else {
			fs.writeFile(base_ctl + 'report.cache', JSON.stringify(body), function(err) {
				writePullLog('Updated', function() {
					cbk(body.data);   
			    	});
			}); 			    
		    }	
	    } else {
		    writePullLog('Error ::'+body.message, function() {
			cbk(body)    
		    });			    
	    }		    
	    
       });
      
}
	
_f['P2'] = function (cbk) {
	var R = new FOLDER_SCAN();
	R.scan(base,  '', 
	function(data) {
		 cbk(data.list);
	}); 
}

function existFile(P1, fn) {
	for (o in P1) {
		if ((o + '/' + P1[o].master.master_video) == fn) return true;
		for (o_1 in P1[o].list) {
			if (fn ==  (o + '/' + o_1)) return true	 	
		} 
	}
	return false;
}

CP.serial(
	_f,
	function(data) {

		var P1 = data.results.P1, P2 = data.results.P2, cg=[], rmv=[];
		for (o in P1) {
			if ((P1[o].master.size) && (P1[o].master.size != P2[o + '/' + P1[o].master.master_video])) {
				cg[cg.length] = o  + '/video/video.mp4';
			} 
			for (o_1 in P1[o].list) {
				if (P1[o].list[o_1] != P2[o + '/' + o_1]) {
					cg[cg.length] = P1[o].master.code  + '/' + o_1;	 
				}	
			} 
			 
		}	
		for (var o in P2) {
			if (!existFile(P1, o)) {
				rmv[rmv.length] = o;  
			}	
		}
		
		var CP1 = new crowdProcess();
		var _f1 = {}, tm = new Date().getTime();

		for (var i = 0; i < rmv.length; i++) {
			_f1['rmv_'+i] = (function(i) {
				return function(cbk) {
					if (new Date().getTime() - tm > 20000) {
						cbk('stopped at ' + (new Date().getTime() - tm));
						CP1.exit = 1;
					} else {					
						exec('rm -fr ' + base + ' ' + rmv[i], function(error, stdout, stderr) {
							cbk('removed ' + base + rmv[i] + ' at: ' + (new Date().getTime() - tm) + ' ms');
							writeRepLog('removed::'+rmv[i], function() {  
							});				
						});
					}	
				}
			})(i);	
		}
	
		for (var i = 0; i < cg.length; i++) {
			_f1['b_'+i] = (function(i) {
				return function(cbk) {
					if (new Date().getTime() - tm > 20000) {
						cbk('stopped at ' + (new Date().getTime() - tm));
						CP1.exit = 1;
					} else {
						folderP.build(path.dirname(base + cg[i]), function() {
							var http = require('http');
							var file = fs.createWriteStream(base + cg[i]);
							var request = http.get('http://api.shusiou.com/api/pipe_stream.js?fn='+cg[i], function(response) {
								response.pipe(file);
								response.on('end', function() {
									cbk('pulled ' + cg[i] + ' at: ' + (new Date().getTime() - tm) + ' ms');	
								
									writeRepLog('pulled::'+cg[i], function() {  
									});
								
								});
							});		
						});
					}	
				}
			})(i);	
		}
		
		CP1.serial(
			_f1,
			function(data1) {
			//	console.log(data)
			//	console.log('>')
			//	console.log(data1.results)
			},
			60000
		);	
		return true;
		
	},
	60000
);

