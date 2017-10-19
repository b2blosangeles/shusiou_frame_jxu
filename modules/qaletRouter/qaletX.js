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

		this.load = function() {
			var me = this;
			
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "X-Requested-With");
			res.header('Access-Control-Allow-Headers', 'Content-Type'); 			
			
			var xP = req.params[0].match(/(cssrange|jsx)\/(.*)$/i);
			if (xP) {
				delete require.cache[__dirname + '/_X/'+xP[1]+'/plugin.js'];
				var X = require(__dirname + '/_X/'+xP[1]+'/plugin.js');				
				var x = new X(pkg, env, req, res, xP[2]);
				x.load();
			} else {
				me.send500({message:'wrong x url:'+req.params[0]+'!!'});
			}
			return true;
		}		
	};
	
	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = obj;
	} 
	
})();