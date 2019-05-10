var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var port = process.env.PORT || 8080;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(path.join(__dirname, 'public')));

const SPEED = 5;
const PLAYER_WIDTH = 32;
const HEIGHT = 640;
const WIDTH = 960;

setInterval(function(){
  let states = {};
  let connected = io.sockets.clients().connected;

  for (var key in connected) {
    if (connected.hasOwnProperty(key)) {
      states[key] = connected[key].state;
      let state = states[key];
      let oldX = state.x;
      let oldY = state.y;

      if (connected[key].left === 1) {
        state.x -= SPEED;
      }

      if (connected[key].right === 1) {
        state.x += SPEED;
      }

      if (connected[key].up === 1) {
        state.y -= SPEED;
      }

      if (connected[key].down === 1) {
        state.y += SPEED;
      }

      if (state.x + PLAYER_WIDTH > WIDTH) {
        state.x = WIDTH - PLAYER_WIDTH;
      }

      if (state.x < 0) {
        state.x = 0;
      }

      if (state.y + PLAYER_WIDTH > HEIGHT) {
        state.y = HEIGHT - PLAYER_WIDTH;
      }

      if (state.y < 0) {
        state.y = 0;
      }

      if (state.x > oldX) {
        state.angle = 0;
      } else if (state.x < oldX) {
        state.angle = 180;
      } else if (state.y > oldY) {
        state.angle = 90;
      } else if (state.y < oldY) {
        state.angle = 270;
      }
    }
  }

  for (var key in connected) {
    if (connected.hasOwnProperty(key)) {
      let state = states[key];

      for (var key2 in connected) {
        if (connected.hasOwnProperty(key2)) {
          let state2 = connected[key2].state;
          // TODO: add collision detection checking state.type
          // TODO: add collision detection for pellets and power pills
          // TODO: update scores
        }
      }
    }
  }

  // TODO: add pellets and power pills under a special key in states
  io.emit('state', states);
}, 50);

// TODO: create a repeating function to add pellets and power pills
// (probably as a Boolean matrix indicating whether a pellet is present at a given (row, column))

// TODO: create a function to create the initial maze

io.on('connection', function(socket){
  console.log('User connected: ' + socket.id);
  socket.left = 0;
  socket.right = 0;
  socket.up = 0;
  socket.down = 0;

  socket.state = {};
  socket.state.x = 200;
  socket.state.y = 200;
  socket.state.angle = 0;
  socket.state.type = "pacman";
  socket.state.score = 0;

  socket.on('disconnect', function(){
    console.log('User ' + socket.id + ' disconnected');
    // TODO: send down a message to client to remove the img with id socket.id
  });

  socket.on('left', function(value){
    socket.left = value;
  });

  socket.on('right', function(value){
    socket.right = value;
  });

  socket.on('up', function(value){
    socket.up = value;
  });

  socket.on('down', function(value){
    socket.down = value;
  });

  socket.on('crashed', function(value){
    if (socket.id === value) {
      socket.state.x = Math.floor(Math.random() * WIDTH);
      socket.state.y = Math.floor(Math.random() * HEIGHT);
    }
  });

  socket.on('init', function(state){
    socket.state.x = state.x;
    socket.state.y = state.y;
    socket.state.type = state.type;
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});