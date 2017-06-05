var PORT = 8008;

var options = {
//    'log level': 0
};

var express = require('express');
var app = express();
var http = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync('/ssl/key.key'),
  cert: fs.readFileSync('/ssl/crt.crt')
};
var server = http.createServer(options);
var io = require('socket.io').listen(server, options);
server.listen(PORT);
app.use('/static', express.static(__dirname + '/static'));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});
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
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
          handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
          throw err;                                  // server variable configures this)
        }
      });
    }

    handleDisconnect();

io.sockets.on('connection', function (client) {
    
    var delEvent = setInterval(function(){
        connection.query('SELECT * FROM event WHERE now=1', function(error, result, fields){
            result.forEach(function(item, i){
                var dateTime = new Date(item.date).getTime();
                var nowTime = new Date().setUTCHours(new Date().getUTCHours()); //+3 часа т.к в базе хранится в 0000 UTC а на сервере +3gmt
                console.log(nowTime, dateTime);
                if(nowTime - dateTime > 1800000){ // пол часа в милисекундах
                    connection.query('UPDATE event SET now=0 WHERE id='+ item.id + '', function(error, result, fields){
                        client.emit('removeFeature', {idFeature: item.id, layer: item.layer});
                        client.emit('RemoveFeatureNotif', item);
                        client.broadcast.emit('RemoveFeatureNotif', item);
                        client.broadcast.emit('removeFeature', {idFeature: item.id, layer: item.layer});
                    })
                }
            });
        });
    },10000);

    client.on('message', function (message) {
        try {
            client.emit('message', message);
            client.broadcast.emit('message', message);
        } catch (e) {
            console.log(e);
            client.disconnect();
        }
    });

    client.on('notification', function (message) {
        client.broadcast.emit('notification', message);
    });

    client.on('addFeature', function (item) {
        connection.query('SELECT * FROM event WHERE now=1 and lat='+ item.lat +' and lon='+ item.lon +' ', function(error, result, fields){
            result.forEach(function(item, i){
               var object = {"type": "Feature", "geometry":{
                        "type": "Point", 
                        "coordinates": [item.lat, item.lon]},
                    "properties":{
                            "id": item.id,
                            "name": item.eventName, 
                            "description": item.description,
                            "userlogin": item.userlogin
                        }
                    };
                    send = JSON.stringify(object);
                    client.emit('addFeature', {feature: send, layer: item.layer});
                    client.broadcast.emit('addFeature', {feature: send, layer: item.layer});
                //console.log(data);
            });
        });
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
                            "description": item.description,
                            "userlogin": item.userlogin
                        }
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
               var object = {"id": item.id, name: item.eventName, description: item.description, userlogin: item.userlogin};
                    send = JSON.stringify(object);
                    client.emit('getFeature', send);
                //console.log(data);
            });
        });
        // send = JSON.stringify(data);
        // console.log(send);
        // client.emit('addFeatures', data);
    });
    client.on('getFeatures', function (user) {
        connection.query('SELECT * FROM `event` WHERE userlogin="'+user+'" and now=1', function(error, result, fields){
            if(error){
                console.log(error);
                return;
            }
            var data = new Array();
            result.forEach(function(item, i){
                var object = new Object();
                    object.id = item.id;
                    object.name = item.eventName;
                    object.description = item.description;
                    object.userlogin = item.userlogin;
                    object.layer = item.layer;
                data.push(object);
                //console.log(data);
            });
            //console.log(data);
            client.emit('getFeatures', JSON.stringify(data));
        });
        // send = JSON.stringify(data);
        // console.log(send);
        // client.emit('addFeatures', data);
    });
    client.on('removeFeature', function (data) {
        client.emit('removeFeature', {idFeature: data.idFeature, layer: data.layer});
        client.broadcast.emit('removeFeature', {idFeature: data.idFeature, layer: data.layer});
        // send = JSON.stringify(data);
        // console.log(send);
        // client.emit('addFeatures', data);
    });
});