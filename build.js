var exec = require('child_process').exec;
var fs    = require('fs');


console.log('Start install npm ...');
exec(
	'npm install forever -g '
	, function(error, stdout, stderr) {
		console.log(error);
	_f();
});		

var _f = function() {
	exec("rm /etc/init.d/qalet_*", function(error, stdout, stderr) {	
		exec("update-rc.d -f 'qalet_*' remove",
			function(error, stdout, stderr){
				// Start Build
				var bufA = fs.readFileSync(__dirname+'/script_template/node_http' , "utf8");	
				
				fs.writeFileSync('/etc/init.d/qalet_node', 
					bufA.replace(/{\$APPLICATION_DIRECTORY}/, __dirname).
						replace(/{\$APPLICATION_START}/, 'qalet_node.js').
						replace(/{\$APPLICATION_NAME}/, 'qalet_node').
						replace(/{\$APPLICATION_CODE}/, 'qalet_node')
					);	
				exec('chmod +x /etc/init.d/qalet_node');
				exec('update-rc.d qalet_node defaults');

				var bufB = fs.readFileSync(__dirname+'/script_template/node_cron' , "utf8");
				
				fs.writeFileSync('/etc/init.d/qalet_cron', bufB.replace(/{\$APPLICATION_DIRECTORY}/, __dirname+'/cron'));
				exec('chmod +x /etc/init.d/qalet_cron');
				exec('update-rc.d qalet_cron defaults');

				console.log('Build done. Need reboot ');
			//	exec('reboot');
			}
		);		
		
	});
		
	
}
