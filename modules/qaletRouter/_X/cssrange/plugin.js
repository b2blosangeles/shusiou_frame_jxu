(function () {
	
	var obj =  function (pkg, env, req, res, req_path) {
	
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
		this.ruleSelect = function(rule, code) {
			var c = (code[0] == '.')?code:('#' + code);
			if (rule.selectors) {
				 for (s in rule.selectors) {
					rule.selectors[s] = c + ' ' + rule.selectors[s];

				 }
			} else {
				for (r in rule.rules) {
					this.ruleSelect(rule.rules[r], code);
				}
			}
		}
		this.load = function() {
			var me = this;
			var xP = req_path.match(/^([^\/]+)\/(.*)$/i);
			if ((xP) && (xP[2])) {
				pkg.request(xP[2], function (err, response, body) {
				  if (err) {
					res.send('/*ERR -- error  access css url:' + xP[2] + ' -- */');  
				  } else {
					var css = require(__dirname + '/pkg/css/node_modules/css');
					try {
						var obj = css.parse(body.replace(/\}([\;|\s]*)/g,'} '));
						me.ruleSelect(obj.stylesheet, xP[1]);
						var s = css.stringify(obj);	
						res.send(s);	
					} catch (err) {
						res.send('/*ERR --- wrong css syntax in ' + xP[2] + ' ' + err.message + '-- */');
					}
				  }
				});
			} else {
				res.send('/*ERR -- wrong css url: ' + xP[2] + ' -- */');
			}			
		}		
	};
	
	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = obj;
	} 
	
})();