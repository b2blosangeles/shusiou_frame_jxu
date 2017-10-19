var c_folder =  '/tmp/tmp_section/';
var s_file = env.root_path + '/api/SampleVideo_1280x720_5mb.mp4',  s = 1000.5, l =  3.5;
var video_folder = '/var/video/';

if (req.query['s']) {
	s = req.query['s']
}

if (req.query['l']) {
	l = req.query['l']
}

s_file =  video_folder + encodeURIComponent('https://youtu.be/phpT_yukNks')+'.mp4';
var fn = c_folder + s + '_' + l + '.mp4';


var childProcess = require('child_process');
var CP = new pkg.crowdProcess();
var _f = {};

_f['S0'] = function(cbk) {
	var folderP = require(env.root_path + '/api/inc/folderP/folderP');
	var fp = new folderP();
	fp.build(c_folder, function() {
		cbk(c_folder);	
	});
	
};
		
_f['S1'] = function(cbk) {
	pkg.fs.stat(fn, function(err, stat) {
		if (err) {
			var ls = childProcess.exec('ffmpeg  -i ' + s_file + ' -ss '+ s + ' -t ' + l + ' -c copy ' + fn +' -y ', 		   
				function (error, stdout, stderr) {
					cbk(true);
				});
		} else {
			cbk(true);
		}
	});
}

CP.serial(
	_f,
	function(data) {
		pkg.fs.stat(fn, function(err, data) {
		    if (err) 
		      res.send('it does not exist');
		    else {
			      var total = data.size;
			      var range = req.headers.range;
			      if (range) {
					var parts = range.replace(/bytes=/, "").split("-");
					var partialstart = parts[0]; var partialend;
					  partialend =  parts[1];
					var start = parseInt(partialstart, 10);
					var end = partialend ? parseInt(partialend, 10) : total-1;
					var chunksize = (end-start)+1;
					var file = pkg.fs.createReadStream(fn, {start:start, end:end});

					res.writeHead(206, {'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 
						'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
				       file.pipe(res);
				} else {
					res.send('Need streaming player');
				}
			}
		});
	},
	30000
);
