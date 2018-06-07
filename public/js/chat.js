$( document ).ready(function() {
  var socket = io.connect('http://localhost:4200');

  var urlParams = new URLSearchParams(window.location.search);
  var conversation_id = urlParams.get('id');

  $("#chat_form").hide();
  $("#invite-link").hide();
  $(".chatbox-top").hide();

  socket.on('connect', function(data) {
     socket.emit('join', conversation_id);
  });

  socket.on('clients', function(noOfClients, client) {
    if (client && socket.id === client.id) {
      if (!conversation_id) {
        var a = $('<a>').attr({href: "http://localhost:4200?id=" + client.id, target: "_blank"}).text(" >> Join");
        $("#invite-link").append(a);
        $("#invite-link").show();
      }
      var that = $(".chatbox-top");
      var userName = $('<span />').attr({'data-id': client.id}).addClass("user-name").text(client.name);
      var room = $("<span />").text("Room >> ");
      var onlineIcon = $('<span />').attr({'data-id': client.id}).addClass("status online");
      $(".join-users", that).append(room, onlineIcon, userName)
      that.show();
    }

    if (noOfClients > 0) {
      $("#chat_form").show();
      $("#user_form").hide();
    } else {
      $("#user_form").show();
     }
  });

  socket.on('disconnect client', function(id) {
    var joinClients = $(".join-users span[data-id]");
    if ((joinClients.length / 2) > 2) {
      var clients = joinClients.filter((i, v) => $(v).data("id") === id);
      clients.remove();
    } else {
      $(".join-users span").remove();
      $("#invite-link a").remove();
      $(".chat-messages div").remove();
      $(".chatbox-top").hide();
      $("#chat_form").hide();
      $("#user_form").show();
    }
  });

  socket.on('show online status', function(roomAdmin) {
    if (roomAdmin && roomAdmin.join.length) {
      var that = $(".chatbox-top");
      var ids = $(".join-users span[data-id]").map((i, v) => $(v).data("id"));
      roomAdmin.join.map(client => {
        if (socket.id !== client.id && $.inArray(client.id, ids) < 0) {
          var userName = $('<span />').attr({'data-id': client.id}).addClass("user-name").text(client.name);
          var onlineIcon = $('<span />').attr({'data-id': client.id}).addClass("status online");
          $(".join-users", that).append(onlineIcon, userName)
        }
      });

      ids = $(".join-users span[data-id]").map((i, v) => $(v).data("id"));

      if ($.inArray(roomAdmin.id, ids) < 0) {
        var userName = $('<span />').attr({'data-id': roomAdmin.id}).addClass("user-name").text(roomAdmin.name);
        var onlineIcon = $('<span />').attr({'data-id': roomAdmin.id}).addClass("status online");
        $(".join-users", that).append(onlineIcon, userName);
      }
    }
  });

  socket.on('messages', function(client, msg) {
    var messageBoxHolder = $("<div>").addClass("message-box-holder");
    var messageBox = $("<div>").addClass("message-box").text(msg)

    if (client && socket.id !== client.id) {
      var messageSender = $("<div>").addClass("message-sender").text(client.name);
      $(messageBoxHolder).append(messageSender);
      $(messageBox).addClass("message-partner")
    }

    $(messageBoxHolder).append(messageBox);
    $('.chat-messages').append(messageBoxHolder);
  });

  $('#chat_form').submit(function(e){
    e.preventDefault();
    var message = $('#msg').val();
    if (conversation_id) {
      socket.emit('conversation private post', {
        room: conversation_id,
        message: message
      });
    } else {
      socket.emit('messages', {
        room: socket.id,
        message: message
      });
    }
  });

  $('#user_form').submit(function(e){
    e.preventDefault();
    var name = $('#user-name').val();
    if (conversation_id) {
      socket.emit('add join user', {
        room: conversation_id,
        name: name
      });
    } else {
      socket.emit('add user', name);
    }
  });
});