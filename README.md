# shusiou_frame

1. It is a master of shusiou.
2. It is api server. 
3. cron/cron.json : cron configuration
4. cron/cron_service/git_service.js update code from git 
5. cron/cron_service/pull_master.js: pull master server file tree every 3 minutes 
   no whole pull if no file updated
6. /cron/cron_service/update_service.js: report node resource to master every 2 minutes.

