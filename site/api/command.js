pkg.exec('nodejs ' + env.root_path + '/cron/cron_service/pull_master.js', function(error, stdout, stderr) {
	 res.send(stdout);
});
