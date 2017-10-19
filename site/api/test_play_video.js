/*
if (!req.query['video']) {
	res.send('Url error');
	return true;
}

var video = req.query['video'].split('|'), fn;
var base = '/var/video/';

var c_folder = base + video[0] + '/tmp_section/';
var s_file = base + video[0] + '/video/video.mp4',  s =  video[1], l =  video[2];
var fn = c_folder + s + '_' + l + '.mp4';
*/
// var fn =  env.root_path + '/api/SampleVideo_1280x720_5mb.mp4'
var fn =  '/tmp/' + encodeURIComponent('https://youtu.be/phpT_yukNks')+'.mp4';

// https%3A%2F%2Fyoutu.be%2FphpT_yukNks

pkg.fs.stat(fn, function(err, data) {
    if (err) 
      res.redirect('http://api.shusiou.com'+req.url);
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
