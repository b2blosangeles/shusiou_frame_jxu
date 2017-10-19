var opt = req.param('opt'), code = req.param('code');
if (!code) {
   res.send('missing code!!');
} else {   
   switch(opt) {
      case 'show':
         var fn = '/var/log/'+code;
         pkg.fs.stat(fn, function(err, data) {
            if (err) {
               res.send('No log file ' + code);
            } else {         
                  var stream = require("stream")
                  var s = new stream.PassThrough();
                  s.push('*** Current view time:' + new Date().toString() + " *** \n\n");
                  s.end()	 

                  var readerStream1 = pkg.fs.createReadStream(fn);

                  s.on('end', function(){
                            readerStream1.pipe(res, { end:false});
                     });		

                  readerStream1.on('end', function(){
                     res.end();
                      });

                  s.pipe(res, { end:false});
               }
            });
            break;
      case 'clean':
         var exec = require('child_process').exec;
         var cmd = 'rm  /var/log/'+ code;
         exec(cmd, function(error, stdout, stderr) {
             res.send(cmd + ' :: ' + stdout);
           });
         break;
      default:
         res.send('wrong opt!!');
   }
}

//res.sendFile('/tmp/shusiou_git.log');
