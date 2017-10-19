var fn = '/var/log/cron_git.log';
pkg.fs.stat(fn, function(err, data) {
	if (err) {
		//      res.redirect('http://api.shusiou.com'+req.url);
		res.send('NO');
	} else {

		var stream = require("stream")
		var s = new stream.PassThrough();
		s.push('*** Current view time:' + new Date().toString() + " *** \n\n");
		s.end()		
		/*
		var Readable = require('stream').Readable;
		var s = new Readable();
		s.push('*** 5 Current view time:' + new Date().toString() + " *** \n\n");
		s.push(null);
		*/
		
		var readerStream1 = pkg.fs.createReadStream(fn);
		var readerStream2 = pkg.fs.createReadStream(fn);
		s.on('end', function(){
       			 readerStream1.pipe(res, { end:false});
    		});		
		readerStream1.on('end', function(){
       			 readerStream2.pipe(res, { end:false});
    		});
		
		readerStream2.on('end', function(){
			res.end();
		    });
		    
		s.pipe(res, { end:false});
	}
});
