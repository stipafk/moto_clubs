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
    var db_config = {
        host     : 'mysql59.hostland.ru',
        user     : 'host1454604',
        password : 'ab686dc0',
        database : 'host1454604_moto'
    };
    var connection;

    function handleDisconnect() {
      connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                      // the old one cannot be reused.

      connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
          console.log('error when connecting to db:', err);
          setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
      });                                     // process asynchronous requests in the meantime.
                                              // If you're also serving http, display a 503 error.
      connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
          handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
          throw err;                                  // server variable configures this)
        }
      });
    }

    handleDisconnect();
    
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