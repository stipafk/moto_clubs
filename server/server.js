var PORT = 8008;

var options = {
//    'log level': 0
};

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server, options);
server.listen(PORT);
app.use('/static', express.static(__dirname + '/static'));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (client) {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
      host     : 'mysql59.hostland.ru',
      user     : 'host1454604',
      password : 'ab686dc0',
      database : 'host1454604_moto'
    });
    
    //client.database='host1454604_moto';

    client.on('message', function (message) {
        try {
            client.emit('message', message);
            client.broadcast.emit('message', message);
        } catch (e) {
            console.log(e);
            client.disconnect();
        }
    });

    client.on('addFeature', function () {
        client.emit('addFeature');
    });
    client.on('addFeatures', function () {
        var data = [];
        connection.query('SELECT * FROM event WHERE now=1', function(error, result, fields){
            result.forEach(function(item, i){
               var object = {"type": "Feature", "geometry":{
                        "type": "Point", 
                        "coordinates": [item.lat, item.lon]},
                    "properties":{
                        "id": item.id,
                        "name": item.eventName, 
                        "description": item.description}
                    };
                    send = JSON.stringify(object);
                    client.emit('addFeature', {feature: send, layer: item.layer});
                //console.log(data);
            });
        });
        // send = JSON.stringify(data);
        // console.log(send);
        // client.emit('addFeatures', data);
    });
    client.on('getFeature', function (id) {
        var data = [];
        connection.query('SELECT * FROM event WHERE now=1 and id ='+ id, function(error, result, fields){
            result.forEach(function(item, i){
               var object = {"id": item.id, name: item.eventName, description: item.description};
                    send = JSON.stringify(object);
                    client.emit('getFeature', send);
                //console.log(data);
            });
        });
        // send = JSON.stringify(data);
        // console.log(send);
        // client.emit('addFeatures', data);
    });
});