pkg.exec('shutdown -r +1', function(error, stdout, stderr) {
	 res.send('Server will be reboot in 1 minute!');
});
