pkg.exec('cd ' + env.root_path + '&& git pull', function(error, stdout, stderr) {
	 res.send(stdout);
});
