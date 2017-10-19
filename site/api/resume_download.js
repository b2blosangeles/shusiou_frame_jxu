var ytdl = require(env.root_path + '/api/inc/ytdl-core/node_modules/ytdl-core');
var mysql = require(env.root_path + '/api/inc/mysql/node_modules/mysql');

function getServerIP() {
    var ifaces = require('os').networkInterfaces(), address=[];
    for (var dev in ifaces) {
        var v =  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false);
        for (var i=0; i < v.length; i++) address[address.length] = v[i].address;
    }
    return address;
};

var holder_ip = getServerIP();

var CP = new pkg.crowdProcess();
var _f = {};

_f['P0'] = function(cbk) {
	var cfg0 = require(env.root_path + '/api/cfg/db.json');
	var connection = mysql.createConnection(cfg0);
	connection.connect();
	var str = 'UPDATE `download_queue` SET `status` = 0, `holder_ip` = "", `hold_time` = NULL';
	connection.query(str, function (error, results, fields) {
		connection.end();
		if (error) {
			cbk('falseB');
		} else {
			if (results.length) {
				cbk(results[0]);
			} else {
				cbk('falseA');
			}

		}
	});  
};
CP.serial(
	_f,
	function(data) {
		res.send({_spent_time:data._spent_time, status:data.status, data:data});
	},
	59000
);
