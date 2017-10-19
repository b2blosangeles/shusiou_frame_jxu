(function () {
	var obj =  function (root_path) {
		var folderP  = require(__dirname + '/folderP.js');
		var fs = require('fs');
		this.folderP = new folderP();
		
		this.qaletBabel = function(fn, key, callback, qaletBabel) {
			var me = this;
			var patt = new RegExp('^' + root_path + '/files/');
			var p = '/tmp/cache/'+ fn.replace(patt, '').replace(/\//g, '_')+'/';
			fs.exists(p + key, function(exists){
				if(exists){
					me.read(p + key, function(data) {
						callback(data);
					});
				} else {
					qaletBabel.jsx2js(fn, function(err, v) {
						if (err) {
							callback('console.log("'+err.message.replace('"', '')+'");');
						} else {
							me.folderP.build(p, function() {
								fs.readdir(p, function(err, files){

									for (var i = 0; i < files.length; i++) {
										if ((p + files[i]) != fn) {
											fs.unlink( p + files[i]);
										}		
									 }								
									me.write(p + key, v.code, function() {
										callback(v.code);
									});							
								});

							});							
							callback(v.code);
						}   
					});
				}
			});
		}		
		this.read = function(fn, cbk) {
			fs.readFile(fn,'utf8', function (err,data) {
				if (!err) {
					cbk(data);
				} else {
					cbk('');
				}
			});
		}		
		this.write = function(fn, data, cbk) {	
			
			fs.writeFile(fn, data, function (err) {
				cbk();
			});
		}		    
	};
	
	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = obj;
	} 
	
})();
