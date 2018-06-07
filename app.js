var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

var clients = {};
var noOfClients = 0;

io.on('connection', function(client) {

  client.on('subscribe', function(room) {
    if (clients[room]) {
      clients[room].join.push(client.id);
    }

    client.join(room);
  });

  client.on('join', function(room) {
    console.log('Got connect!', Object.keys(clients), client.id);
    if (room) {
      var noOfClients = 0;
      client.join(room);
      if (clients[room]) {
        noOfClients = clients[room].join.length
      }
      
      client.broadcast.to(room).emit('clients', noOfClients, clients[client.id]);
    }
  });

  client.on('messages', function(data) {
    client.broadcast.to(data.room).emit('messages', data.message);
    client.emit('messages', data.message);
  });

  client.on('conversation private post', function(data) {
    client.broadcast.to(data.room).emit('messages', data.message);
    client.emit('messages', data.message);
  });

  client.on('add user', function(username) {
    clients[client.id] = { id: client.id, name: username, join: [] };
    client.emit('clients', 0, clients[client.id]);
  });

  client.on('add join user', function(data) {
    var noOfClients = 0;
    if (clients[data.room]) {
      clients[data.room].join.push(client.id);
      noOfClients = clients[data.room].join.length
    }

    clients[client.id] = { id: client.id, name: data.name, join: [] };
    client.broadcast.to(data.room).emit('clients', noOfClients, clients[client.id]);
    client.emit('clients', noOfClients, clients[client.id]);
  });

  client.on('disconnect', function(data) {
    console.log('Got disconnect!');
    delete clients[client.id];
    io.emit('clients', Object.keys(clients).length);
  });
});


server.listen(4200);