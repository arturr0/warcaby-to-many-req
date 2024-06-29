const app = require('./app.js'); // Import the Express app
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const express = require('express');
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const lockFile = require('lockfile');
const io = socketIo(server);
app.use('/public', express.static(path.join(__dirname, "public")));
// Namespace for /warcaby
const warcabyNamespace = io.of('/warcaby');

// Define the path to your JSON file
const jsonFilePath = path.join(__dirname, 'data', 'players.json');
const lockFilePath = path.join(__dirname, 'data', 'players.lock');
const users = [];
let BOARD;
let PAWNS;
let TURN;
let CHECK;
let PLAY;
let KILL;
let KILLER_MODE;
let KILLED2;
let KILLED_MODE;
let PLAYERS = [];

//io.sockets.emit('new state', BOARD, PAWNS, TURN, PLAY, CHECK, KILL);
//io.to(USERS[0][1]).emit('chat', MESS, USER)
warcabyNamespace.on('connection', (socket) => {
    //////////////console.log('We have a new client in /warcaby: ' + socket.id);

    // Track the server the client joined
    socket.on('joinServer', (data) => {
        const ROOM = `room_${data.index}`;
        socket.serverIndex = data.index;

        lockFile.lock(lockFilePath, { wait: 5000 }, (lockErr) => {
            if (lockErr) {
                console.error('Error acquiring lock:', lockErr);
                socket.emit('error', 'Server error: Unable to acquire lock');
                return;
            }

            fs.readFile(jsonFilePath, 'utf8', (err, fileData) => {
                if (err) {
                    console.error('Error reading JSON file:', err);
                    socket.emit('error', 'Server error: Unable to read server data');
                    lockFile.unlock(lockFilePath, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                    });
                    return;
                }

                try {
                    let jsonData = JSON.parse(fileData);
                    const server = jsonData[data.index];

                    if (!server) {
                        socket.emit('error', 'Invalid server index');
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                        return;
                    }

                    if (data.player === 1) {
                        server.block = 0; // Unblock for user2
                        server.user1 = data.inputText;
                    } else if (data.player === 2) {
                        server.user2 = data.inputText;
                    } else {
                        socket.disconnect(true);
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                        return;
                    }

                    fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                        if (writeErr) {
                            console.error('Error writing to JSON file:', writeErr);
                        } else {
                            //socket.serverIndex = data.index; // Store the server index in the socket object
                            users.push([data.index, data.inputText, socket.id, data.player]);
                            socket.join(ROOM);
                            //////////////console.log(`Socket ${socket.id} joined room ${ROOM}`);
                            warcabyNamespace.to(ROOM).emit('joinedRoom', ROOM);
                        }

                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                    });
                } catch (err) {
                    console.error('Error parsing JSON data:', err);
                    socket.emit('error', 'Server error: Unable to parse server data');
                    lockFile.unlock(lockFilePath, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                    });
                }
            });
        });
    })
    socket.on('send2', (message, room) => {
        const MESS = message; 
        warcabyNamespace.to(room).emit('send to room', MESS);
    });
    socket.on('send1', (message, room) => {
        const MESS = message;

        socket.broadcast.to(room).emit('send to opponent', MESS);
    });
    socket.on('turn', function(Greenturn, check, room) {
        if (!check) TURN = !Greenturn;
        else TURN = Greenturn;
        //console.log('TURN', TURN);
        //console.log('check', check);
        warcabyNamespace.to(room).emit('new turn', TURN);
    });
    socket.on('state', function(Board, Pawns, Greenturn, check, current, room) {

        BOARD = Board;
        PAWNS = Pawns;
        ////////////console.log(check);
        // if (!check) TURN = !Greenturn;
        // else TURN = Greenturn;
        //TURN = !Greenturn;
        //CHECK = check;
        PLAY = current;
        //KILL = killConditionsUnique;
        ////////////////console.log("state " + TURN);
        warcabyNamespace.to(room).emit('new state', BOARD, PAWNS, PLAY);

      });
    
      socket.on('move', function(targetPos, room, animatedPawn) {
        // Constructing the new position object
        let newPos = { 
          x: targetPos.x, 
          y: targetPos.y, 
          oldX: targetPos.oldX, 
          oldY: targetPos.oldY 
          // Include looserIndex if needed, for example:
          // looserIndex: targetPos.looserIndex 
        };
        let PAWN = animatedPawn
      
        // Broadcasting 'animate' event to all clients in the specified room
        socket.broadcast.to(room).emit('animate', newPos, PAWN);
      });
    
      socket.on('multikill', function(killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room) {
        KILLER_MODE = killersOptMode;
        KILLED_MODE = killedOptMode;
        KILLED2 = oneKiller2Killed;
        PAWNS = Pawns;
        warcabyNamespace.to(room).emit('update multikill', KILLER_MODE, KILLED_MODE, KILLED2, PAWNS);  
      });
    //   socket.on('killedOptMode mode', function(killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room) {
    //     KILLER_MODE = killersOptMode;
    //     KILLED_MODE = killedOptMode;
    //     KILLED2 = oneKiller2Killed;
    //     PAWNS = Pawns;
    //     warcabyNamespace.to(room).emit('update killedOptMode mode', KILLER_MODE, KILLED_MODE, KILLED2, PAWNS);  
    //   });
    //   socket.on('oneKiller2Killed mode mode', function(oneKiller2Killed, Pawns, room) {
    //     KILLED2 = oneKiller2Killed;
    //     PAWNS = Pawns;
    //     warcabyNamespace.to(room).emit('update kille1killed2 mode', KILLED2, PAWNS);  
    //   });
    
      socket.on('complete', function(Player, room) {
        PLAYERS.push([Player, room]);
        ////console.log('complete', Player, room);
        for (let i = 0; i < PLAYERS.length; i++) {
            for (let j = i + 1; j < PLAYERS.length; j++) {
                if (((PLAYERS[i][0] == 1 && PLAYERS[j][0] == 2) || (PLAYERS[i][0] == 2 && PLAYERS[j][0] == 1)) &&
                    PLAYERS[i][1] == room && PLAYERS[j][1] == room) {
                    
                    warcabyNamespace.to(PLAYERS[j][1]).emit('both completed');
                    
                    console.log('condition');
                    console.log(PLAYERS[i]);
                    console.log(PLAYERS[j]);
        
                    // Splice the higher index first
                    PLAYERS.splice(j, 1);
                    PLAYERS.splice(i, 1);
        
                    //////////console.log('before //////////console PLAYERS');
                    //////////console.log(PLAYERS);
                    //////////console.log('after //////////console PLAYERS');
                    
                    // Decrement the index to adjust for the removed element
                    i--;
                    break; // Break to restart the outer loop since the array has changed
                }
            }
        }
        console.log(PLAYERS);
        
      });
      socket.on('message kill', function(message, played, pawnLetter, pawnNumber, pawnLetterLooser, pawnNumberLooser, room) {
        let MES = message;
        let PLAYED = played;
        
        let LETTER = pawnLetter;
        let NUMBER = pawnNumber;
        let LETTER_LOOSER = pawnLetterLooser;
        let NUMBER_LOOSER = pawnNumberLooser;
        warcabyNamespace.to(room).emit('update message kill', MES, PLAYED, LETTER, NUMBER, LETTER_LOOSER, NUMBER_LOOSER);  
      });
      socket.on('blockKill false', function(blockKill, blockKillPawn, releaseBlock, killmode, room) {
        let BLOCK_KILL = blockKill;
        let BLOCK_KILL_PAWN = blockKillPawn;
        let RELEASE_BLOCK = releaseBlock;
        let KILL_MODE = killmode;
        
        socket.broadcast.to(room).emit('update blockKill false', BLOCK_KILL, BLOCK_KILL_PAWN, RELEASE_BLOCK, KILL_MODE);  
      });
      socket.on('message move', function(message, played, pawnLetter, pawnNumber, boardLetter, boardNumber, room) {
        let MES = message;
        let PLAYED = played;
        
        let LETTER = pawnLetter;
        let NUMBER = pawnNumber;
        let LETTER_BOARD = boardLetter;
        let NUMBER_BOARD = boardNumber;
        warcabyNamespace.to(room).emit('update message move', MES, PLAYED, LETTER, NUMBER, LETTER_BOARD, NUMBER_BOARD);  
      });
      socket.on('send message', function(inputValString, room, Player) {
        let MESS = inputValString;
        let SENDER = Player;
        //////////////console.log("chat");
        socket.broadcast.to(room).emit('chat', MESS, SENDER);
        
      });
      

    // Handle client disconnection
    socket.on('disconnect', () => {
        if (socket.serverIndex !== undefined) {
            lockFile.lock(lockFilePath, { wait: 5000 }, (lockErr) => {
                if (lockErr) {
                    console.error('Error acquiring lock:', lockErr);
                    return;
                }

                fs.readFile(jsonFilePath, 'utf8', (err, fileData) => {
                    if (err) {
                        console.error('Error reading JSON file:', err);
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                        return;
                    }

                    try {
                        let jsonData = JSON.parse(fileData);

                        if (jsonData[socket.serverIndex]) {
                            jsonData[socket.serverIndex].players = Math.max(0, jsonData[socket.serverIndex].players - 1);
                            console.log(jsonData[socket.serverIndex].players);
                            for (let i = 0; i < users.length; i++) {
                                if (socket.id === users[i][2] && jsonData[users[i][0]].user1 === users[i][1]) {
                                    jsonData[users[i][0]].user1 = '';
                                    //jsonData[users[i][0]].players--;
                                } else if (socket.id === users[i][2] && jsonData[users[i][0]].user2 === users[i][1]) {
                                    jsonData[users[i][0]].user2 = '';
                                    //jsonData[users[i][0]].players--;
                                } 

                                if (socket.id === users[i][2] && jsonData[socket.serverIndex].players == 0)
                                    jsonData[users[i][0]].block = 1;  

                            }

                            fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                                if (writeErr) {
                                    console.error('Error writing to JSON file:', writeErr);
                                } else {
                                    console.log('JSON file updated successfully after disconnection');
                                }

                                lockFile.unlock(lockFilePath, (unlockErr) => {
                                    if (unlockErr) {
                                        console.error('Error releasing lock:', unlockErr);
                                    }
                                });
                                
                            });
                        } else {
                            lockFile.unlock(lockFilePath, (unlockErr) => {
                                if (unlockErr) {
                                    console.error('Error releasing lock:', unlockErr);
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Error parsing JSON data:', err);
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                    }
                });
            });
        }
    });
});

server.listen(port, () => {
    //////////////console.log(`Server is running on port ${port}`);
});
