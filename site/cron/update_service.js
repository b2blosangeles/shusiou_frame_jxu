var path = require('path');
var env = {root_path:path.join(__dirname, '../../')};

function getServerIP() {
    var ifaces = require('os').networkInterfaces(), address=[];
    for (var dev in ifaces) {
        var v =  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false);
        for (var i=0; i < v.length; i++) address[address.length] = v[i].address;
    }
    return address;
};

var diskspace = require(env.root_path + '/package/diskspace/node_modules/diskspace'),
    request = require(env.root_path + '/package/request/node_modules/request');
    
diskspace.check('/', function (err, space)
{
    request({
        url: 'http://api.shusiou.com/api/cluster_update.js',
        method: "POST",
        headers: {
            "content-type": "application/json",
            },
        json: {ip:getServerIP(), space:space}
        }, function (error, resp, body) { 
        //  res.send(body);
       });

});
