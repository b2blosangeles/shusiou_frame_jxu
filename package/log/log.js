/*
	The log mudule is to add log to top of log file
*/
(function () { 
	var obj =  function () {
		var fs = require('fs'), exec = require('child_process').exec;
		this.write = function(file, cmd, contents) {
			var l =  contents.toString().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '\\$&').
				replace(/[\n\r]/g, '\\n');
			var c =  cmd.toString().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '\\$&').
				replace(/[\n\r]/g, '\\n');
			
			var log_str = "sed -i '1s/^/=== " + c + ' --> ' +  new Date().toString() + '===\\n' + l + "\\n/' " + file;
  			fs.appendFile(file, ' ', function(err) {
				exec(log_str, function(error, stdout, stderr) {});
  			});			
			
		};	
	};
	module.exports = obj;
})();
