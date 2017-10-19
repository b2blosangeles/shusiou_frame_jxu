(function () { 
		var obj =  function () {
			this.jsx2js = function(file, cbk) {
				require("babel-core").transformFile(file, {
				  plugins: [__dirname + '/node_modules/babel-plugin-transform-react-jsx']
				},function(err, v) {
						cbk(err, v);
				});	
			};
		};

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = obj;
	} else {
		window.qaletBabel = function() {
			return obj; 
		}
	}
})();
