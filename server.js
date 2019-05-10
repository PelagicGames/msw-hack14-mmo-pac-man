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

const SPEED = 4;
const PLAYER_WIDTH = 32;
const HEIGHT = 640;
const WIDTH = 960;

setInterval(function(){
  let states = {};
  let connected = io.sockets.clients().connected;

  for (var key in connected) {
    if (connected.hasOwnProperty(key)) {
      if (!connected[key].init_called) {
        continue;
      }

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
      if (state.type === "pacman") {
          for (var i = 0; i < 30; i++){
              for (var j = 0; j < 20; j++){
                if (state.x == 32*i + 11){
                  if(state.y == 32*j + 11) {
                    console.log("remove pellet")
                    io.emit("remove pellet", "i" + i + "j" + j)
                }
              }
            }
          }
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

      var playerCentreX = state.x + 16;
      var playerCentreY = state.y + 16;
      var playerLeftEdge = state.x;
      var playerRightEdge = state.x + 32;
      var playerTopEdge = state.y;
      var playerBottomEdge = state.y +32;

      // // Check for walls to the left
      if (isWall(pixelToGrid(playerLeftEdge), pixelToGrid(playerCentreY)))      {
        console.log("WALL!");
      }
      // Check for a wall to the right
      // Check for a wall above
      // Check for a wall below

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
      if (!connected[key].init_called) {
        continue;
      }

      let state = states[key];

      for (var key2 in connected) {
        if (connected.hasOwnProperty(key2)) {
          if (!connected[key2].init_called) {
            continue;
          }

          if (key === key2) {
            break;
          }

          let state2 = connected[key2].state;

          if (state.type != state2.type) {
            if (Math.abs(state.x - state2.x) < 32) {
              if (Math.abs(state.y - state2.y) < 32) {
                let placed = false;
                let xSpawn = 0;
                let ySpawn = 0;

                while (!placed) {
                  xSpawn = Math.floor(Math.random() * WIDTH / PLAYER_WIDTH) * PLAYER_WIDTH;
                  ySpawn = Math.floor(Math.random() * HEIGHT / PLAYER_WIDTH) * PLAYER_WIDTH;

                  if (!isWall(xSpawn, ySpawn)) {
                    placed = true;
                  }
                }

                if (state.type === "pacman") {
                  state.x = xSpawn;
                  state.y = ySpawn;
                } else {
                  state2.score += 100;
                  state2.x = xSpawn;
                  state2.y = ySpawn;
                }

                scores.ghosts += 100;
              }
            }
          }
        }

        // TODO: add collision detection for pellets and power pills
      }
    }
  }

  // TODO: add pellets and power pills under a special key in states
  io.emit('state', states);
  io.emit('score', scores);
}, 50);

// TODO: create a repeating function to add pellets and power pills
// (probably as a Boolean matrix indicating whether a pellet is present at a given (row, column))

// TODO: create a function to create the initial maze
var maze = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

var scores = {"ghosts": 0, "pacmans": 0};
var counts = {"ghosts": 0, "pacmans": 0};

io.on('connection', function(socket){
  console.log('User connected: ' + socket.id);
  socket.left = 0;
  socket.right = 0;
  socket.up = 0;
  socket.down = 0;
  socket.init_called = false;

  socket.state = {};
  socket.state.x = 200;
  socket.state.y = 200;
  socket.state.angle = 0;
  socket.state.type = "pacman";
  socket.state.score = 0;
  socket.state.id = socket.id;

  socket.on('disconnect', function(){
    console.log('User ' + socket.id + ' disconnected');
    counts[socket.state.type + "s"] -= 1;

    if (counts[socket.state.type + "s"] < 0) {
      counts[socket.state.type + "s"] = 0;
    }

    io.emit('remove', socket.id);
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

  socket.on('pre_init', function(){
    // TODO: Randomise start position, or maybe try to start in a safe location
    let placed = false;
    let xSpawn = 0;
    let ySpawn = 0;

    while (!placed) {
      xSpawn = Math.floor(Math.random() * WIDTH / PLAYER_WIDTH) * PLAYER_WIDTH;
      ySpawn = Math.floor(Math.random() * HEIGHT / PLAYER_WIDTH) * PLAYER_WIDTH;

      if (!isWall(xSpawn, ySpawn)) {
        placed = true;
      }
    }

    socket.state.x = xSpawn;
    socket.state.y = ySpawn;

    if (counts.pacmans === 0) {
      socket.state.type = "pacman";
    } else if (counts.ghosts === 0) {
      socket.state.type = "ghost";
    } else {
      if (scores.ghosts > counts.ghosts * 1000) {
        if (scores.pacmans > counts.pacmans * 1000) {
          if (scores.ghosts / counts.ghosts > scores.pacmans / counts.pacmans) {
            socket.state.type = "pacman";
          } else {
            socket.state.type = "ghost";
          }
        } else {
          if (scores.ghosts / counts.ghosts > 1000) {
            socket.state.type = "pacman";
          } else {
            socket.state.type = "ghost";
          }
        }
      } else {
        if (scores.pacmans > counts.pacmans * 1000) {
          if (1000 > scores.pacmans / counts.pacmans) {
            socket.state.type = "pacman";
          } else {
            socket.state.type = "ghost";
          }
        } else {
          if (Math.random() > 0.5) {
            socket.state.type = "pacman";
          } else {
            socket.state.type = "ghost";
          }
        }
      }
    }

    counts[socket.state.type + "s"] += 1;

    io.emit('init', socket.state);
  });

  socket.on('init', function(){
    socket.init_called = true;
  });

  io.emit('maze', maze);
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function isWall(xPos, yPos) {  
  if (maze[yPos, xPos] === 1){
    return true;
  } else{
    return false;
  }
}

function pixelToGrid(pixel){
  var grid = Math.round(pixel / PLAYER_WIDTH);
  return grid;
}
