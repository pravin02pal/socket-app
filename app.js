var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

var clients = {};
var noOfClients = 0;

io.on('connection', function(client) {

  client.on('join', function(room) {
    if (room) {
      console.log('Got connect!');
      var noOfClients = 0;
      client.join(room);
      if (clients[room]) {
        noOfClients = clients[room].join.length
      }

      client.broadcast.to(room).emit('clients', noOfClients, clients[client.id]);
    }
  });

  client.on('messages', function(data) {
    client.broadcast.to(data.room).emit('messages', clients[client.id], data.message);
    client.emit('messages', clients[client.id], data.message);
  });

  client.on('conversation private post', function(data) {
    client.broadcast.to(data.room).emit('messages', clients[client.id], data.message);
    client.emit('messages', clients[client.id], data.message);
  });

  client.on('add user', function(username) {
    clients[client.id] = { id: client.id, name: username, room: client.id, join: [] };
    client.emit('clients', 0, clients[client.id]);
  });

  client.on('add join user', function(data) {
    var noOfClients = 0;
    clients[client.id] = { id: client.id, name: data.name, room: data.room, join: [] };
    if (clients[data.room]) {
      clients[data.room].join.push(clients[client.id]);
      noOfClients = clients[data.room].join.length
    }
    client.broadcast.to(data.room).emit('show online status', clients[data.room]);
    client.broadcast.to(data.room).emit('clients', noOfClients, clients[client.id]);
    client.emit('clients', noOfClients, clients[client.id]);
    client.emit('show online status', clients[data.room]);
  });

  client.on('disconnect', function(data) {
    if (clients[client.id]) {
      var room = clients[client.id].room;
      delete clients[client.id];
      if (clients[room] && clients[room].join.length) {
        var index = -1;
        clients[room].join.map((c, i) => {
          if (c.id === client.id) {
            index = i;
          }
        });

        if (index > -1) {
          clients[room].join.splice(index, 1);
        }
      }
      client.broadcast.to(room).emit('disconnect client', client.id);
    }
  });
});


server.listen(4200);