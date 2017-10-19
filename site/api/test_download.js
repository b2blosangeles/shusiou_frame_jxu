var ytdl = require(env.root_path + '/api/inc/ytdl-core/node_modules/ytdl-core');
var mysql = require(env.root_path + '/api/inc/mysql/node_modules/mysql');
var url = 'https://youtu.be/WAXH_9bpLfI';
var total=0;
var s = 0;
var t = [];
/*
ytdl.getInfo(url, {},  function(err, info){
  if ((err) || !info) {
    res.send(false);
  } else {
    var r = {vid:info.video_id, title:info.title, length_seconds:parseInt(info.length_seconds), thumbnail_url:info.thumbnail_url};
    res.send(info);
  }  
});
return true;
*/
//var video = ytdl(url, {range: {start:start, end:end}, quality:'18'});

function getServerIP() {
    var ifaces = require('os').networkInterfaces(), address=[];
    for (var dev in ifaces) {
        var v =  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false);
        for (var i=0; i < v.length; i++) address[address.length] = v[i].address;
    }
    return address;
};

var video = ytdl(url, {quality:'18'});
video.pipe(pkg.fs.createWriteStream('/tmp/niu.mp4'));	


video.on('data', function(info) {
	total += info.length;
	t[t.length] = info.length;
	s++;
}); 

video.on('end', function(info) {
	res.send(s+'-done!!' + total + "==" + getServerIP());
});	
/*
video.on('error', function() {
	cbk({idx:c_m, status:9});
});			
*/

return true;

var folder_base = '/mnt/shusiou-video/youtube/';
var step = 30000000;

var CP = new pkg.crowdProcess();
var _f = {};

_f['P0'] = function(cbk) {
	var cfg0 = require(env.space_path + '/api/cfg/db.json');
	var connection = mysql.createConnection(cfg0);
	connection.connect();

	var str = 'SELECT * FROM  `video_queue` WHERE `source` = "youtube" AND `status` = 0 AND NOW() - `created` > 180 ORDER BY `created` ASC LIMIT 10; ';

	connection.query(str, function (error, results, fields) {
		connection.end();
		if (error) {
			cbk(false);
		} else {
			if (results.length) {
				cbk(results[0]);
			} else {
				cbk(false);
			}

		}
	});  
};

_f['P1'] = function(cbk) {
	if (CP.data.P0) {
		var cfg0 = require(env.space_path + '/api/cfg/db.json');
		var connection = mysql.createConnection(cfg0);
		connection.connect();

		var str = 'DELETE FROM  `video_queue` WHERE `id` = "' + CP.data.P0.id + '"; ';

		connection.query(str, function (error, results, fields) {
			connection.end();
			if (error) {
				cbk(error.message);
				return true;
			} else {
				if (results.length) {
					cbk(results[0]);
				} else {
					cbk(false);
				}

			}
		});	
	} else {
		cbk(CP.data.P0);
	} 
};
_f['P2'] = function(cbk) {
	if (CP.data.P0) {
		var cfg0 = require(env.space_path + '/api/cfg/db.json');
		var connection = mysql.createConnection(cfg0);
		connection.connect();

		var str = 'UPDATE  `video_queue` SET `created` = `created` + 180; ';

		connection.query(str, function (error, results, fields) {
			connection.end();
			if (error) {
				cbk(error.message);
				CP.exit = 1; 
				return true;
			} else {
				if (results.length) {
					cbk(results[0]);
					CP.exit = 1; 
				} else {
					cbk(false);
					CP.exit = 1; 
				}

			}
		});	
	} else {
		cbk(CP.data.P0);
	}
	
	 
};
_f['Q1'] = function(cbk) {
	var cfg0 = require(env.space_path + '/api/cfg/db.json');
	var connection = mysql.createConnection(cfg0);
	connection.connect();

	var str = 'SELECT * FROM  `video_queue` WHERE `source` = "youtube" AND `status` = 0 ORDER BY `created` ASC LIMIT 100; ';

	connection.query(str, function (error, results, fields) {
		connection.end();
		if (error) {
			cbk(error.message);
			return true;
		} else {
			if (results.length) {
				cbk(results[0]);
				CP.skip = true;
			} else {
				cbk(false);
			}

		}
	});  
};

_f['Q2'] = function(cbk) {
	if (!CP.data.Q1 || !CP.data.Q1.source_code) {
		cbk(false);
		CP.exit = true;
	} else {
		cbk(CP.data.Q1.source_code);
	}
};



_f['Q3'] = function(cbk) {
	var url = CP.data.Q2, vid = CP.data.Q1.code, m = JSON.parse(CP.data.Q1.matrix), c_m = null;
	for (var i = 0; i < m.length; i++) {
		if (m[i] == 0) {
			c_m = i;
			break;
		}
	}
	var start = c_m * step;
	var end = (c_m + 1) * step - 1;	
	if (c_m !== null) {
		var folderP = require(env.space_path + '/api/inc/folderP/folderP');
		var fp = new folderP();
		fp.build(folder_base  + vid + '/video/tmp/', function() {
			ytdl.getInfo(url, function(err) {
				if (err) {
					cbk({idx:c_m, status:9});
					return true;
				}
				var video = ytdl(url, {range: {start:start, end:end}, quality:'18'});


				video.pipe(pkg.fs.createWriteStream(folder_base + vid + '/video/tmp/' + c_m +'.mp4'));	
				video.on('data', function(info) {}); 

				video.on('end', function(info) {
					cbk({idx:c_m, status:1});
				});	

				video.on('error', function() {
					cbk({idx:c_m, status:9});
				});			
			});
		});
		
	} else {
		cbk(false);
	}
};

_f['Q4'] = function(cbk) {
	var m = JSON.parse(CP.data.Q1.matrix), vid = CP.data.Q1.code;
	m[CP.data.Q3.idx] = CP.data.Q3.status;
	
	var cfg0 = require(env.space_path + '/api/cfg/db.json');
	var connection = mysql.createConnection(cfg0);
	connection.connect();

	var str = 'UPDATE `video_queue` SET `matrix` = "' + JSON.stringify(m) + '" '+
	    'WHERE `source` = "youtube" AND `status` = 0 AND code = "' + vid + '"; ';

	connection.query(str, function (error, results, fields) {
		
		connection.end();
		if (error) {
			cbk(error.message);
			return true;
		} else {
			cbk(m);
		}
	}); 	
	
};

_f['AF1'] = function(cbk) {
	var cfg0 = require(env.space_path + '/api/cfg/db.json');
	var connection = mysql.createConnection(cfg0);
	connection.connect();

	var str = 'SELECT * FROM  `video_queue` WHERE `source` = "youtube" AND `status` = 0 ORDER BY `created` ASC LIMIT 1; ';

	connection.query(str, function (error, results, fields) {
		connection.end();
		if (error) {
			cbk(error.message);
			return true;
		} else {
			if (results.length) {
				cbk(results[0]);
				CP.skip = true;
			} else {
				cbk(false);
			}

		}
	});  
};

_f['matrix_change'] = function(cbk) {
	var m = JSON.parse(CP.data.AF1.matrix), v = [];
	var vid = CP.data.AF1.code;

	/--- Save adjusted matrix ---*/
	var cfg0 = require(env.space_path + '/api/cfg/db.json');
	var connection = mysql.createConnection(cfg0);
	connection.connect();	
	for (var i = 0; i < m.length; i++) {
		if (m[i] == 9) {
			break;
		} else {
			v[v.length] = m[i];
		}
		
	}	
	var str = 'UPDATE `video_queue` SET `matrix` = "' + JSON.stringify(v) + '" '+
	    'WHERE `source` = "youtube" AND `status` = 0 AND code = "' + vid + '"; ';

	connection.query(str, function (error, results, fields) {
		connection.end();
		if (error) {
			cbk(false);
		} else {
			cbk(v);
		}
	}); 	
	return true;	
};

_f['AF2'] = function(cbk) {
	if (!CP.data.AF1 || !CP.data.AF1.source_code || !CP.data.matrix_change) {
		cbk(false);
		CP.exit = true;
	} else {
		var m = CP.data.matrix_change;	
		for (var i = 0; i < m.length; i++) {
			if (m[i] == 0) {
				cbk(false);
				return true;
			}
		}			
		cbk(CP.data.AF1.code);
	}
};
_f['AF3'] = function(cbk) {
	if (CP.data.AF2 === false) {
	 	cbk(false);
	} else {
		var cfg = require(env.space_path + '/api/cfg/db.json');
		cfg['multipleStatements'] = true;
		var connection = mysql.createConnection(cfg);
		connection.connect();
		
		var info = JSON.parse(decodeURIComponent(CP.data.AF1.info));
		var m = JSON.parse(decodeURIComponent(CP.data.AF1.matrix));
		var code = CP.data.AF1.code;
		
		var cmd_str = 'cd ' + folder_base + code + '/video/tmp && cat ';
		for (var i = 0; i < m.length; i++) {
			if (m[i] == 1) cmd_str += i + '.mp4 ';	
		}
		cmd_str += ' > '+ folder_base + code + '/video/video.mp4 && rm -fr ' + folder_base + code + '/video/tmp';
		
		var childProcess = require('child_process');
		var ls = childProcess.exec(cmd_str, 		   
			function (error, stdout, stderr) {
				if (error) cbk(false);
				else {
					var fn = folder_base + code + '/video/video.mp4';
					pkg.fs.stat(fn, function(err, stats) {
						if (err) {
							cbk(false);
						} else {
							var size =  stats["size"];
							
							var str = 'INSERT INTO videos (`source`, `code`, `title`, `length`, `size`) ' +
								'values ("youtube", "' + CP.data.AF2 + '", "' + info.title + '","' + info.length_seconds +  
								'", "' + size + '"); ';
							 str += 'DELETE FROM video_queue WHERE `source` = "youtube" AND  `code` = "' + CP.data.AF2 + '"; ';
							connection.query(str, function (error, results, fields) {
								connection.end();
								if (error) {
									cbk(error.message);
									return true;
								} else {
									cbk(true);
								}
							});
						}
					});			
					
				}
			});		
		return true;	
	}
	
};

CP.serial(
	_f,
	function(data) {
		res.send({_spent_time:data._spent_time, status:data.status, data:data});
	},
	30000
);

