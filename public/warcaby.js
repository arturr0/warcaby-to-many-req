// Connect to the /warcaby namespace
const socket = io.connect('https://fantastic-obsidian-radish.glitch.me/warcaby');
////////////////////////////////////////////////console.log("warcaby");
let Player;
let room = "";
let playerName;
//let killerActive = null;

socket.on('connect', () => {
  console.log('Connected to /warcaby namespace');

  // Retrieve the stored server data from local storage
  const serverData = JSON.parse(localStorage.getItem('serverData'));
  console.log(serverData);

  if (serverData) {
      Player = serverData.player;
      playerName = serverData.inputText;
      console.log(Player);
      console.log(playerName);

      // Emit the joinServer event with the retrieved data
      socket.emit('joinServer', {
          inputText: serverData.inputText,
          index: serverData.index,
          players: serverData.players,
          player: serverData.player // Send player information
      });

      // Optionally, clear the data from local storage if it is no longer needed
      localStorage.removeItem('serverData');
  }
});

socket.on('joinedRoom', (ROOM) => {
  console.log(`Joined room: ${ROOM}`);
  room = ROOM;
  console.log(room);
  let roomInfo = document.querySelector('#room');
  console.log(room);
  roomInfo.value = room;
  document.dispatchEvent(new Event('socketConnected'));
});

socket.on('error', (message) => {
  console.error(message);
  alert(message); // Show the error message to the user
});
socket.on('joinedRoom', (ROOM) => {
    //////////////////////////////////////////////////console.log(`Joined room: ${ROOM}`);
    room = ROOM;
    ////////////////////////////////////////////////console.log(room);
    let roomInfo = select('#room');
    //////////////////////////////////////////////console.log(room)
    roomInfo.value(room);
    document.dispatchEvent(new Event('socketConnected'));
});


let Board = [];
let Letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
let Numbers = []
let freeBoard;
let Kills = [];



let killsOpt = [];

function Area(rectCenter, rectCenterY, row, column, isBlack, free, letter, number, queen, check) {
  this.rectCenter = rectCenter;
  this.rectCenterY = rectCenterY;
  this.row = row;
  this.column = column;
  this.isBlack = isBlack;
  this.free = free;
  this.letter = letter;
  this.number = number;
  this.queen = false;
  this.check = false;
}

let areaCenter = 64;
let row = 0;
let column = 0;

//let targetPos;
let movingPawn = null;
let pawnCompletedMove = false;
let isPawnMoving = false;

let RedMove = false;
let GreenMove = false;



let check = false;
let bothCompleted = false;

let killer = "";

let Pawns = [];

let current;

let Greenturn = false;
let turn;

let killConditions = [];
let killConditionsUnique = [];
let killersOptModeArray = [];
let killedOptModeArray = [];
let oneKiller2KilledArray = [];
let killersOptMode = false;
let killedOpt = [];
let killedOptMode = false;
let oneKiller2Killed = false;
let blockKill = false;
let blockKilledPawn = null;
let blockKillersPawn = null;
let releaseBlock = false;
//let killerSelected = null;
let queenKillConditions = [];
let uniqueQueenKillConditions = [];

let message;
// let pawnLetter;
// let pawnNumber;

function Pawn(rectCenter, rectCenterY, row, column, isRed, queen, live, killer, killed, kill1Killed2, letter, number, queensAreas) {
  this.rectCenter = rectCenter;
  this.rectCenterY = rectCenterY;
  this.row = row;
  this.column = column;
  this.isRed = isRed;
  this.queen = queen;
  this.live = true;
  this.killer = false;
  this.killed = false;
  this.kill1Killed2 = false;
  this.letter = letter;
  this.number = number;
  this.pos = createVector(rectCenter, rectCenterY);
  this.targetPos = null;
  this.queensAreas = [];
  this.update = function() {
    if (this.targetPos) {
      let vel = p5.Vector.sub(this.targetPos, this.pos);
      if (vel.mag() > 1 && this.live) {
        vel.setMag(1);
        this.pos.add(vel);
        pawnCompletedMove = false;
      } else {
        this.pos = this.targetPos.copy();
        this.targetPos = null;
        this.rectCenter = this.pos.x;
        this.rectCenterY = this.pos.y;
        pawnCompletedMove = true; // Mark the move as completed
      }
    }
  };

  this.show = function() {
    // Set fill color based on conditions
    if (this.queen && !this.kill1Killed2 && !this.killed && !this.killer) {
        fill(this.isRed ? 'red' : 'green'); // Fill color for regular queens
    } else if (this.queen && this.killer && !this.isRed && Player == 2) {
        fill('green'); // Fill color for killer queens (Player 2)
    } else if (this.queen && this.killer && this.isRed && Player == 1) {
        fill('red'); // Fill color for killer queens (Player 1)
    } else if (this.queen && (this.killed || this.kill1Killed2)) {
        fill(this.isRed ? 'red' : 'green'); // Fill color for killed or onekiller2killed queens
    } else {
        // Default fill for non-queen pieces
        fill(this.isRed ? 'red' : 'green');
    }
    
    // Set stroke properties
    if (this.queen) {
        strokeWeight(10);
        stroke(255, 223, 0); // Stroke color for queens
    } else if (((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) && (this.killer || this.killed || this.kill1Killed2)) {
        strokeWeight(10);
        stroke(this.killer ? 'blue' : 'gray'); // Stroke color for ordinary pawns
    } else {
        noStroke(); // No stroke for other pieces
    }
    
    // Draw the main circle for queens
    circle(this.pos.x, this.pos.y, 50);
    
    // Additional circles for specific queen conditions
    if (this.queen) {
        noFill(); // No fill for additional circles
        strokeWeight(6); // Set stroke weight for additional circles
        
        if (this.killer) {
            stroke(0, 0, 255); // Stroke color for additional circle of killer queens
        } else if (this.killed || this.kill1Killed2) {
            stroke(128, 128, 128); // Stroke color for additional circle of killed or onekiller2killed queens
        }
        
        // Draw additional circle
        circle(this.pos.x, this.pos.y, 54);
    }
};



}

let X;
let Y;
let pawnSelected = false;
let pawnPlayed;


// socket.on('player', function(PLAYER) {
//   Player = PLAYER;
//   document.dispatchEvent(new Event('socketConnected'));

//   //////////////////////////////////////////////////console.log(Player);
// });

socket.on('update message kill', function(MES, PLAYED, LETTER, NUMBER, LETTER_LOOSER, NUMBER_LOOSER) {
  const newSpan = document.createElement('span');
  newSpan.className = 'message_kill';
  newSpan.textContent = `PAWN ${LETTER}${NUMBER} CAPTURES ON ${LETTER_LOOSER}${NUMBER_LOOSER}`;

  if (PLAYED) {
    newSpan.style.color = 'red';
  } else {
    newSpan.style.color = 'green';
  }

  document.getElementById('history').appendChild(newSpan);
  jQuery("#history").scrollTop(jQuery("#history")[0].scrollHeight);
});

socket.on('update message move', function(MES, PLAYED, LETTER, NUMBER, LETTER_BOARD, NUMBER_BOARD) {
  const newSpan = document.createElement('span');
  newSpan.className = 'message_move';
  newSpan.textContent = `PAWN ${LETTER}${NUMBER} TO ${LETTER_BOARD}${NUMBER_BOARD}`;

  if (PLAYED) {
    newSpan.style.color = 'red';
  } else {
    newSpan.style.color = 'green';
  }

  document.getElementById('history').appendChild(newSpan);
  jQuery("#history").scrollTop(jQuery("#history")[0].scrollHeight);
});


socket.on('both completed', function() {
  bothCompleted = true;
  //////////////console.log('socket on both completed', bothCompleted);
});
socket.on('new turn', function(TURN) {
    //////console.log('new turn condition', killConditions.length);
    //////console.log('new turn unique', killConditionsUnique.length)
  Greenturn = TURN;
  generateQueensAreas()
  kill(blockKilledPawn, blockKillersPawn);
  killOpt(killConditionsUnique);
  stepKill(killConditionsUnique);

  ////////////////console.log('socket turn', Greenturn);
});

socket.on('update multikill', function(KILLER_MODE, KILLED_MODE, KILLED2, PAWNS) {
for (let i = 0; i < PAWNS.length; i++) {
    
    Pawns[i].killer = PAWNS[i].killer;
    Pawns[i].killed = PAWNS[i].killed;
    Pawns[i].kill1Killed2 = PAWNS[i].kill1Killed2;

    
    }
  
  killersOptMode = KILLER_MODE;
  killedOptMode = KILLED_MODE;
  oneKiller2Killed = KILLED2;
  //killConditionsUnique = [];
  for (let i = 0; i < killConditionsUnique.length; i++)
    // for (let j = 0; j < killersOpt.length; j++)
    //   if (killConditionsUnique[i][0] == killersOpt[j][0] && killConditionsUnique[i][1] == killersOpt[j][1]) {
    //     ////////////////////////////////////////////////////////////////////////console.log("delete");
    //     //killConditionsUnique.splice(i, 1);
    //     //////////console.log('splice killer mode', killConditionsUnique);
    //   }
      ////////////////////console.log('update killer mode', killConditionsUnique);
  killersOptModeArray = [];
  killedOptModeArray = [];
  oneKiller2KilledArray = [];
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(Player);
});
// socket.on('update killed mode', function(KILLED_MODE, PAWNS) {
//   for (let i = 0; i < PAWNS.length; i++) {
      
//       Pawns[i].killed = PAWNS[i].killed;
//       Pawns[i].kill1Killed2 = PAWNS[i].kill1Killed2; 
      
//       }
    
//     killedOptMode = KILLED_MODE;
//     //killConditionsUnique = [];
//     for (let i = 0; i < killConditionsUnique.length; i++)
//       for (let j = 0; j < killersOpt.length; j++)
//         if (killConditionsUnique[i][0] == killersOpt[j][0] && killConditionsUnique[i][1] == killersOpt[j][1]) {
//           ////////////////////////////////////////////////////////////////////////console.log("delete");
//           //killConditionsUnique.splice(i, 1);
//           //////////console.log('splice killed mode', killConditionsUnique);
//         }
//         ////////////////////console.log('update killed mode', killConditionsUnique);
//     killersOpt = [];
//     ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(Player);
//   });
  // socket.on('animate', function(data) {
  //   let newPos = createVector(data.x, data.y);
  //   let targetPawn = Pawns.find(pawn => pawn.rectCenter === data.oldX && pawn.rectCenterY === data.oldY && pawn.live);
  //   //////////////////////console.log(targetPawn);
  //   if (targetPawn) {
  //     //////////////////////console.log("animate");  // Debug log to confirm animation trigger
  //     targetPawn.targetPos = newPos;
  //     movingPawn = targetPawn;
  //   }
  // });
  socket.on('update kille1killed2 mode', function(KILLED2, PAWNS) {
    for (let i = 0; i < PAWNS.length; i++) {
        
        //Pawns[i].killed = PAWNS[i].killed;
        Pawns[i].kill1Killed2 = PAWNS[i].kill1Killed2; 
        
        }
      
      oneKiller2Killed = KILLED2;
      //killConditionsUnique = [];
      for (let i = 0; i < killConditionsUnique.length; i++)
        for (let j = 0; j < killersOpt.length; j++)
          if (killConditionsUnique[i][0] == killersOpt[j][0] && killConditionsUnique[i][1] == killersOpt[j][1]) {
            ////////////////////////////////////////////////////////////////////////console.log("delete");
            //killConditionsUnique.splice(i, 1);
            //////////console.log('splice killed mode', killConditionsUnique);
          }
          ////////////////////console.log('update killed mode', killConditionsUnique);
      killersOpt = [];
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(Player);
    });
    // socket.on('animate', function(data) {
    //   let newPos = createVector(data.x, data.y);
    //   let targetPawn = Pawns.find(pawn => pawn.rectCenter === data.oldX && pawn.rectCenterY === data.oldY && pawn.live);
    //   //////////////////////console.log(targetPawn);
    //   if (targetPawn) {
    //     //////////////////////console.log("animate");  // Debug log to confirm animation trigger
    //     targetPawn.targetPos = newPos;
    //     movingPawn = targetPawn;
    //   }
    // });
  socket.on('animate', function(data, PAWN) {
    let newPos = createVector(data.x, data.y);
    let targetPawn = Pawns[PAWN];
    //////////////////////console.log(targetPawn);
    
      //////////////////////////////console.log("animate");  // Debug log to confirm animation trigger
      targetPawn.targetPos = newPos;
      movingPawn = targetPawn;
    
  });

socket.on('new state', function(BOARD, PAWNS, PLAY) {
  //Greenturn = TURN;
  //////////////////////////////////////////console.log(Greenturn);
  for (let i = 0; i < BOARD.length; i++) {
    Board[i].free = BOARD[i].free;
    Board[i].row = BOARD[i].row;
    Board[i].column = BOARD[i].column;
    Board[i].queen = BOARD[i].queen;

  }
  for (let i = 0; i < PAWNS.length; i++) {
    Pawns[i].row = PAWNS[i].row;
    Pawns[i].column = PAWNS[i].column;
    Pawns[i].letter = PAWNS[i].letter;
    Pawns[i].number = PAWNS[i].number;
    Pawns[i].live = PAWNS[i].live;
    Pawns[i].isRed = PAWNS[i].isRed;
    Pawns[i].killer = PAWNS[i].killer;
    Pawns[i].queen = PAWNS[i].queen;
    
  }
  //kill(blockKilledPawn, blockKillersPawn);
  //Greenturn = TURN;
  
  movingPawn = Pawns[PLAY];
  //killConditionsUnique = KILL;
  ////////////////////console.log('new state', killConditionsUnique);
  //if (Pawns[PLAY].isBlack == Greenturn) killConditionsUnique = [];
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(PLAY);
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(movingPawn);
});

socket.on('update blockKill false', function(BLOCK_KILL, BLOCK_KILL_PAWN, RELEASE_BLOCK, KILL_MODE) {
  blockKill = BLOCK_KILL;
  blockKilledPawn = BLOCK_KILL_PAWN;
  releaseBlock = RELEASE_BLOCK;
  ////console.log('releaseBlock update blockKill false', releaseBlock)
  killmode = KILL_MODE;
  
});

function setup() {
  const myCanvas = createCanvas(576, 576);
  myCanvas.style('border-radius', '15px');
  myCanvas.parent('game');
  
  turn = select('#turn');
  let PlayerInfo = select('#player');
  
  if (Player == 2) {document.getElementById("player").style.color = "green"; PlayerInfo.value("GREEN");}
  else if (Player == 1) {document.getElementById("player").style.color = "red"; PlayerInfo.value("RED");}
  killer = select('#kill');
  rectMode(CENTER);
  

  let isBlack = true;
  for (let i = 0; i < 8; i++)
    Numbers.push(i + 1);

  for (let i = 0; i < 8; i++) {
    row++;
    column = 0;
    isBlack = !isBlack;

    for (let j = 0; j < 8; j++) {
      let rectCenter = (column * 64 + 32) + 32;
      column++;
      let area = new Area(rectCenter, (row * 64 - 32) + 32, row, column, isBlack, true, Letters[j], Numbers[i]);
      Board.push(area);
      
      isBlack = !isBlack;
    }
  }
  //f(rectCenter, rectCenterY, row, column, isRed, queen, live, killer, killed, letter, number)
  for (let j = 0; j < Board.length; j++) {
    if (Board[j].isBlack && Board[j].row < 4) {
      Board[j].free = false;
      let pawn = new Pawn(Board[j].rectCenter, (Board[j].row * 64 - 32) + 32, Board[j].row, Board[j].column, true, false, true, false, false, false, Board[j].letter, Board[j].number);
      Pawns.push(pawn);
    } else if (Board[j].isBlack && Board[j].row > 5) {
      Board[j].free = false;
      let pawn = new Pawn(Board[j].rectCenter, (Board[j].row * 64 - 32) + 32, Board[j].row, Board[j].column, false, false, true, false, false, false, Board[j].letter, Board[j].number);
      Pawns.push(pawn);
    }
  }
  // Board[58].free = true;
  Pawns[8].queen = true;
  Pawns[11].queen = true;
  Pawns[14].queen = true;
  //generateQueensAreas();
}

function draw() {
  turn.value(Greenturn);
  let PlayerInfo = select('#player');
  
  
  if (Player == 2) {document.getElementById("player").style.color = "green"; PlayerInfo.value("PLAYER GREEN");}
  else if (Player == 1) {document.getElementById("player").style.color = "red"; PlayerInfo.value("PLAYER RED");}
  if (Greenturn) document.getElementById("turn").style.color = "green";
  else document.getElementById("turn").style.color = "red";
  background(0);
  
  for (let i = 0; i < Board.length; i++) {
    let color = Board[i].isBlack ? 0 : 255;
    noStroke();
    fill(color);
    rect(Board[i].rectCenter, Board[i].rectCenterY, 64, 64);
    fill(255);
    textSize(10);
    text(i, Board[i].rectCenter - 25, Board[i].rectCenterY - 25);
  }
  stroke(255);
  strokeWeight(3); // Set the thickness of the line to 4 pixels
  line(30, 30, 546, 30);
  line(30, 30, 546, 30);
  line(30, 30, 30, 546);
  line(30, 546, 546, 546);
  line(546, 30, 546, 546);
  for (let i = 0; i < Pawns.length; i++) {
    if (Pawns[i].live) {
      //Pawns[i].update();
      Pawns[i].show();
      fill(0); // Set the fill color for the text
      noStroke();
      textSize(32); // Set the size of the text
      textAlign(CENTER, CENTER); // Align the text to the center both horizontally and vertically
      text(i, Pawns[i].rectCenter, Pawns[i].rectCenterY);
    }
  }

  for (let i = 0; i < Letters.length; i++) {
    
      
      fill(255); // Set the fill color for the text
      noStroke();
      textSize(20); // Set the size of the text
      textAlign(CENTER, CENTER); // Align the text to the center both horizontally and vertically
      text(Letters[i], 64 + i*64, 16);
      text(Letters[i], 64 + i*64, 562);
    
  }
  for (let i = 0; i < Numbers.length; i++) {
    
      
    fill(255); // Set the fill color for the text
    noStroke();
    textSize(20); // Set the size of the text
    textAlign(CENTER, CENTER); // Align the text to the center both horizontally and vertically
    text(Numbers[i], 14, 64 + i*64);
    text(Numbers[i], 562, 64 + i*64);
  
}

  if (movingPawn) {
    
    movingPawn.update();
    movingPawn.show();
    
  }
  //kill(blockKilledPawn, blockKillersPawn);
   ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log("OUT " + pawnCompletedMove);
   ////////////////////////////////////////////////console.log(killersOptMode);
  //  if (pawnCompletedMove && !killersOptMode) {
  //   kill(blockKilledPawn, blockKillersPawn);
  //   killOpt();
  //   stepKill();
    
  //   }
   ////////////////console.log(bothCompleted);
   if (bothCompleted) {
    
    //////////////////console.log('completed out player condition', killConditionsUnique)
    
    //////////////console.log('check in completed', check);
        ////////////////console.log('turn in completed', Greenturn);
    ////////console.log('completed after condition', killConditionsUnique.length);
    if ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) {
      ////////console.log('completed in condition', killConditionsUnique.length);
      socket.emit('turn', Greenturn, check, room);
    }
    

    // kill(blockKilledPawn, blockKillersPawn);
    // killOpt(killConditionsUnique);
    // stepKill(killConditionsUnique);
    
    bothCompleted = false;
    
    ////////////////////////////////////console.log('both') 
   }
   if (pawnCompletedMove) {
    ////////////////////////////////////console.log('pawnCompletedMove');
    // kill(blockKilledPawn, blockKillersPawn);
    // killOpt();
    // stepKill();
    
    movingPawn = null; // Reset movingPawn after completing the move
    pawnCompletedMove = false;
    
    //Greenturn = !Greenturn;
    ////////////////////////////////////////////////////////////////////for (let z = 0; z < killConditionsUnique.length; z++)
                ////////////console.log(killConditionsUnique[z]);
    
    
    
    isPawnMoving = false;
    // socket.emit('state', Board, Pawns, Greenturn, check, current); // Send the move to the server
    // socket.emit('move', { x: targetPos.x, y: targetPos.y, oldX: movingPawnOldPos.x, oldY: movingPawnOldPos.y });
    socket.emit('complete', Player, room);
    return;
  }
  

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(kill(blockKilledPawn, blockKillersPawn));
  
  for (let i = 0; i < Board.length; i++) {
    if (Board[i].free && Board[i].isBlack) {
      strokeWeight(1);
      stroke(255);
      noFill();
      rect(Board[i].rectCenter, Board[i].rectCenterY, 55, 55);
    }
    if (Board[i].check) {
      strokeWeight(1);
      stroke(255, 0, 0);
      noFill();
      rect(Board[i].rectCenter, Board[i].rectCenterY, 70, 70);
    }
  }
}

function mouseClicked() {
  X = mouseX;
  Y = mouseY;
  ////////////////////////////////console.log(`killedOptMode: ${killedOptMode} killersOptMode: ${killersOptMode}`)
  // Check if a pawn is clicked
  for (let i = 0; i < Pawns.length; i++) {
    let p = Pawns[i];
    if (!isPawnMoving && (!killedOptMode && !killersOptMode && !oneKiller2Killed) && ((p.isRed && !Greenturn && Player == 1) || (!p.isRed && Greenturn  && Player == 2)) && p.live &&
        X > p.rectCenter - 32 && X < p.rectCenter + 32 && Y > p.rectCenterY - 32 && Y < p.rectCenterY + 32) {
      pawnSelected = true;
      pawnPlayed = i;
      //console.log(pawnPlayed)
      //generateQueensAreas(i);
      ////////////////////////////////console.log(pawnPlayed);
      return;
    }
  }

  for (let k = 0; k < Board.length; k++) {
    if (pawnSelected && Pawns[pawnPlayed].row == Board[k].row && Pawns[pawnPlayed].column == Board[k].column && Pawns[pawnPlayed].live) {
      freeBoard = k;
    }
  }
  //generateQueensAreas();
  // Check if a valid move is made
  if (pawnSelected) {
    
    //check = true;
    
    for (let j = 0; j < Board.length; j++) {
      if (Board[j].isBlack &&
        X > Board[j].rectCenter - 32 && X < Board[j].rectCenter + 32 &&
        Y > Board[j].rectCenterY - 32 && Y < Board[j].rectCenterY + 32 &&
        Board[j].free &&
        (
          (
            Pawns[pawnPlayed].isRed &&
            Pawns[pawnPlayed].row - Board[j].row == -1 &&
            (
              Pawns[pawnPlayed].column - Board[j].column == 1 ||
              Pawns[pawnPlayed].column - Board[j].column == -1
            )
          ) ||
          (
            !Pawns[pawnPlayed].isRed &&
            Pawns[pawnPlayed].row - Board[j].row == 1 &&
            (
              Pawns[pawnPlayed].column - Board[j].column == 1 ||
              Pawns[pawnPlayed].column - Board[j].column == -1
            )
          ) ||
          (
            Pawns[pawnPlayed].queen &&
            Pawns[pawnPlayed].queensAreas.find(board => board[0] == Board[j].row && board[1] == Board[j].column)
          )
        )
    ) {
              //Greenturn = !Greenturn;
        ////////////////////////////////console.log(Pawns[pawnPlayed]);
        //pawnActive = pawnPlayed;
        let pawnLetter = Pawns[pawnPlayed].letter;
        let pawnNumber = Pawns[pawnPlayed].number;
        let boardLetter = Board[j].letter;
        let boardNumber = Board[j].number;
        let played = Pawns[pawnPlayed].isRed;
        message = "move";
        socket.emit('message move', message, played, pawnLetter, pawnNumber, boardLetter, boardNumber, room);
        Board[freeBoard].free = true;
        let targetPos = createVector(Board[j].rectCenter, Board[j].rectCenterY);
        let movingPawnOldPos = { x: Pawns[pawnPlayed].rectCenter, y: Pawns[pawnPlayed].rectCenterY };
        Pawns[pawnPlayed].targetPos = targetPos;
        movingPawn = Pawns[pawnPlayed];
        Pawns[pawnPlayed].row = Board[j].row;
        Pawns[pawnPlayed].column = Board[j].column;
        Pawns[pawnPlayed].letter = Board[j].letter;
        Pawns[pawnPlayed].number = Board[j].number;
        Board[j].free = false;
        let animatedPawn = pawnPlayed
        check = false;
        ////////////console.log('pawnSelected', check)
        current = pawnPlayed;
        checkQueen();
        //generateQueensAreas(pawnPlayed);
        socket.emit('state', Board, Pawns, Greenturn, check, current, room); // Send the move to the server
        socket.emit('move', { 
          x: targetPos.x, 
          y: targetPos.y, 
          oldX: movingPawnOldPos.x, 
          oldY: movingPawnOldPos.y 
        }, room, animatedPawn);
        pawnSelected = false;
        isPawnMoving = true;
        // generateQueensAreas();
        //Greenturn = !Greenturn;
      }
    }
  }
  // killersOpt.push(killConditionsUnique[i]);
  // killersOpt.push(killConditionsUnique[i + 1]);
  if (killersOptMode) {
    ////////////////////console.log(`killersOptMode: killedOptMode: ${killedOptMode} killersOptMode ${killersOptMode} oneKiller2Killed ${oneKiller2Killed}`)
    ////////////////////console.log('killersOptModeArray', killersOptModeArray);
    ////////////////////console.log('killConditionsUnique outside for loop', killConditionsUnique);
    for (let i = 0; i < killersOptModeArray.length; i++) {
      ////////////////////console.log('for killersOptMode')
      
      
      if (((killersOptModeArray[i][3] && !Greenturn && Player == 1) || (!killersOptModeArray[i][3] && Greenturn  && Player == 2)) &&
          X > killersOptModeArray[i][5] - 32 && X < killersOptModeArray[i][5] + 32 && Y > killersOptModeArray[i][6] - 32 && Y < killersOptModeArray[i][6] + 32) {
            ////////console.log("click");
            for (let j = 0; j < killersOptModeArray.length; j++)
              Pawns[killersOptModeArray[j][0]].killer = false;
            for (let j = 0; j < killedOptModeArray.length; j++)
              Pawns[killedOptModeArray[j][1]].killed = false;
            for (let j = 0; j < oneKiller2KilledArray.length; j++)
              Pawns[oneKiller2KilledArray[j][1]].kill1Killed2 = false;
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killersOptModeArray[i]);
            blockKillersPawn = killersOptModeArray[i][0];
            ////////////////////console.log(`blockKillersPawn ${blockKillersPawn}`);
            ////////////////////console.log('killConditionsUnique in killersOptMode', killConditionsUnique);
            for (let j = 0; j < killConditionsUnique.length; j++)
              if (killConditionsUnique[j][0] != blockKillersPawn) {
                //////////////////////////////////////////////////////////////////////////////console.log(killConditionsUnique[j][0]);
                killConditionsUnique.splice(j,1); 
                //////////console.log('splice killersOptMode', killConditionsUnique)
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killersOptModeArray[i][0]);
              }
            //////////////////////////////////////////////////////////////////////for (let z = 0; z < killConditionsUnique.length; z++)
                ////////////console.log(killConditionsUnique[z]);
            killersOptMode = false;
            killedOptMode = false;
            oneKiller2Killed = false;
            ////////////////////console.log('killers killConditionsUnique[0] ', killConditionsUnique[0])
            
            //kill(blockKilledPawn, blockKillersPawn);
            let firstKill = [];
            killConditions = [];
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            ////console.log('killersOptMode', killConditionsUnique);
            firstKill.push(killersOptModeArray[i])
            killersOptModeArray = [];
            killedOptModeArray = [];
            oneKiller2KilledArray = [];
            //console.log('killersOptMode firstKill', firstKill)
            
            killOpt(firstKill);
            stepKill(firstKill);
            socket.emit('multikill', killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room);
        }
        
        }
        
  
        //return;
      
    }
//killConditionsUnique.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY]);
if (killedOptMode) {
  ////////////////////console.log(`killedOptMode: killedOptMode ${killedOptMode} killedOptModeArrayMode ${killedOptModeArrayMode} oneKiller2Killed ${oneKiller2Killed}`)
  
  ////////////////////console.log(killedOptModeArray)
  for (let i = 0; i < killedOptModeArray.length; i++) 
    //////////////////////console.log('for killedOptMode');
    if (((killedOptModeArray[i][3] && !Greenturn && Player == 1) || (!killedOptModeArray[i][3] && Greenturn  && Player == 2)) &&
        X > killedOptModeArray[i][7] - 32 && X < killedOptModeArray[i][7] + 32 && Y > killedOptModeArray[i][8] - 32 && Y < killedOptModeArray[i][8] + 32) {
          //////////////////////////////////////////////////////////console.log("click");
          for (let j = 0; j < killedOptModeArray.length; j++)
            Pawns[killedOptModeArray[j][1]].killed = false;
          for (let j = 0; j < killersOptModeArray.length; j++)
            Pawns[killersOptModeArray[j][0]].killer = false;
          for (let j = 0; j < oneKiller2KilledArray.length; j++)
            Pawns[oneKiller2KilledArray[j][1]].kill1Killed2 = false;
          ////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killedOptModeArray[i]);
          let killedSelected = killedOptModeArray[i][1];
          blockKilledPawn = killedOptModeArray[i][0];
          //////////////////////////////////////////////////////////////////////////////console.log(pawnSelected);
          for (let j = 0; j < killConditionsUnique.length; j++)
            if (killConditionsUnique[j][1] != killedSelected) {
              //////////////////////////////////////////////////////////////////////////////console.log(killConditionsUnique[j][0]);
              killConditionsUnique.splice(j,1); 
              
              ////////////console.log(killedOptModeArray[i][0]);
              //////////console.log('splice killedOptMode');
              
            }
            ////////////////////console.log('killConditionsUnique after splice in killedOptMode', killConditionsUnique)
          //////////////////////////////////////////////////////////////////////for (let z = 0; z < killConditionsUnique.length; z++)
            ////////////console.log(killConditionsUnique[z]);
          killedOptMode = false;
          killersOptMode = false;
          oneKiller2Killed = false;
          
          //killedOptModeArray = [];
          let firstKill = [];
          ////////////////////console.log('killedOptModeArray[i] before push', killedOptModeArray[i]);
          killConditions = [];
          killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
          
          firstKill.push(killedOptModeArray[i]);
          //console.log('killedOptMode', firstKill);
          killedOptModeArray = [];
          killersOptModeArray = [];
          oneKiller2KilledArray = [];
          ////////////////////console.log('killedOptModeArray');
          ////////////////////console.log('killedOptModeArray[i] after push', killedOptModeArray[i]);
          ////////////////////console.log('firstKill');
          ////////////////////console.log(firstKill);
          
          killOpt(firstKill);
          stepKill(firstKill);
          socket.emit('multikill', killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room);
      }
      
      
      

      //return;
    
  }

  if (oneKiller2Killed) {
    ////////////////////console.log(`oneKiller2KilledArrayMode: killedOptMode: ${killedOptMode} oneKiller2KilledArrayMode ${oneKiller2KilledArrayMode} oneKiller2Killed ${oneKiller2Killed}`)
    ////////////////////console.log('oneKiller2KilledArray', oneKiller2KilledArray);
    ////////////////////console.log('killConditionsUnique outside for loop', killConditionsUnique);
    for (let i = 0; i < oneKiller2KilledArray.length; i++) {
      ////////////////////console.log('for oneKiller2KilledArrayMode')
      
      
      if (((oneKiller2KilledArray[i][3] && !Greenturn && Player == 1) || (!oneKiller2KilledArray[i][3] && Greenturn  && Player == 2)) &&
          X > oneKiller2KilledArray[i][7] - 32 && X < oneKiller2KilledArray[i][7] + 32 && Y > oneKiller2KilledArray[i][8] - 32 && Y < oneKiller2KilledArray[i][8] + 32) {
            //console.log("click 2 killed");
            for (let j = 0; j < killedOptModeArray.length; j++)
              Pawns[killedOptModeArray[j][1]].killed = false;
            for (let j = 0; j < killersOptModeArray.length; j++)
              Pawns[killersOptModeArray[j][0]].killer = false;
            for (let j = 0; j < oneKiller2KilledArray.length; j++)
              Pawns[oneKiller2KilledArray[j][1]].kill1Killed2 = false;
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(oneKiller2KilledArray[i]);
            blockKilledPawn = oneKiller2KilledArray[i][0];
            let chosenKilled = oneKiller2KilledArray[i][1];
            ////////////////////console.log(`blockKillersPawn ${blockKillersPawn}`);
            ////////////////////console.log('killConditionsUnique in oneKiller2KilledArrayMode', killConditionsUnique);
            for (let j = 0; j < killConditionsUnique.length; j++)
              if (killConditionsUnique[j][1] != chosenKilled) {
                //////////////////////////////////////////////////////////////////////////////console.log(killConditionsUnique[j][0]);
                killConditionsUnique.splice(j,1); 
                //////////console.log('splice oneKiller2KilledArrayMode', killConditionsUnique)
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(oneKiller2KilledArray[i][0]);
              }
            //////////////////////////////////////////////////////////////////////for (let z = 0; z < killConditionsUnique.length; z++)
                ////////////console.log(killConditionsUnique[z]);
            killedOptMode = false;
            killersOptMode = false;
            oneKiller2Killed = false;
            ////////////////////console.log('killers killConditionsUnique[0] ', killConditionsUnique[0])
            
            //kill(blockKilledPawn, blockKillersPawn);
            let firstKill = [];
            killConditions = [];
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            ////console.log('two killed', killConditionsUnique);
            firstKill.push(oneKiller2KilledArray[i])
            oneKiller2KilledArray = [];
            //console.log('oneKiller2Killed', firstKill)
            killedOptModeArray = [];
            killersOptModeArray = [];
            oneKiller2KilledArray = [];
            killOpt(firstKill);
            stepKill(firstKill);
            socket.emit('multikill', killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room);
        }
        
        }
        
  
        //return;
      
    }
  
}
let playerHasKill = false;
let multipleKillCond = false;
//let multipleKillCondGreen = false;
let previousPlayer = null;
let killCntr = 0;

let downLeftArray = [];
//fk
function kill(blockKilledPawn, blockKillersPawn) {

  
    
  for (let j = 0; j < Pawns.length; j++) {
    for (let k = 0; k < Pawns.length; k++) {
      if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && !Pawns[k].queen &&
          ( (((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)))) &&
          ((Pawns[k].row - Pawns[j].row == 1 && Pawns[k].column - Pawns[j].column == 1))) {
        for (let i = 0; i < Board.length; i++) {
          if (blockKilledPawn == null && blockKillersPawn == null && Pawns[j].row - Board[i].row == 1 && Pawns[j].column - Board[i].column == 1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 1', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 1', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            // for (let z = 0; z < killConditionsUnique.length; z++)
            //   //////////console.log(killConditionsUnique[z]);
            ////////console.log('push 1', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 1', killConditionsUnique[i]);
            
              
          }
          else if ((k == blockKilledPawn || k == blockKillersPawn) && Pawns[j].row - Board[i].row == 1 && Pawns[j].column - Board[i].column == 1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 1 block', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 1 block', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            // for (let z = 0; z < killConditionsUnique.length; z++)
            //   //////////console.log(killConditionsUnique[z]);
            ////////console.log('push 1', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 1', killConditionsUnique[i]);
            
              
          }
        }
      }
      
      //break;
    }
    
      
  }
  for (let j = 0; j < Pawns.length; j++) {
    for (let k = 0; k < Pawns.length; k++) {
      if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && !Pawns[k].queen &&
          ( (((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)))) &&
          ((Pawns[k].row - Pawns[j].row == 1 && Pawns[k].column - Pawns[j].column == -1))) {
        for (let i = 0; i < Board.length; i++) {
          if (blockKilledPawn == null && blockKillersPawn == null && Pawns[j].row - Board[i].row == 1 && Pawns[j].column - Board[i].column == -1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 2', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 2', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 2', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 2', killConditionsUnique[i]);
            
             
          }
          else if ((k == blockKilledPawn || k == blockKillersPawn) && Pawns[j].row - Board[i].row == 1 && Pawns[j].column - Board[i].column == -1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 2 block', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 2 block', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 2', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 2', killConditionsUnique[i]);
            
             
          }
        }
      }
      
      //break;
    }
    
    
  }
  for (let j = 0; j < Pawns.length; j++) {
    for (let k = 0; k < Pawns.length; k++) {
      if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && !Pawns[k].queen &&
          ( (((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)))) &&
          ((Pawns[k].row - Pawns[j].row == -1 && Pawns[k].column - Pawns[j].column == 1))) {
        for (let i = 0; i < Board.length; i++) {
          if (blockKilledPawn == null && blockKillersPawn == null && Pawns[j].row - Board[i].row == -1 && Pawns[j].column - Board[i].column == 1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 3', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 3', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 3', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 3', killConditionsUnique[i]);
            
            
            
          }
          else if ((k == blockKilledPawn || k == blockKillersPawn) && Pawns[j].row - Board[i].row == -1 && Pawns[j].column - Board[i].column == 1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 3 block', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null]);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 3 block', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            playerHasKill = true;
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 3', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 3', killConditionsUnique[i]);
            
            
            
          }
        }
      }
      
      //break;
    }
  }
  for (let j = 0; j < Pawns.length; j++) {
    for (let k = 0; k < Pawns.length; k++) {
      if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && !Pawns[k].queen &&
          ( (((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)))) &&
          ((Pawns[k].row - Pawns[j].row == -1 && Pawns[k].column - Pawns[j].column == -1))) {
        for (let i = 0; i < Board.length; i++) {
          if (blockKilledPawn == null && blockKillersPawn == null && Pawns[j].row - Board[i].row == -1 && Pawns[j].column - Board[i].column == -1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 4', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null]);
            //////////console.log(`kill 4, killer ${k}, killed ${j}`);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 4', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            playerHasKill = true;
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 4', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 4', killConditionsUnique[i]);
            
             
          }
          else if ((k == blockKilledPawn || k == blockKillersPawn) && Pawns[j].row - Board[i].row == -1 && Pawns[j].column - Board[i].column == -1 && Board[i].free) {
            for (let i = 0; i < killConditions.length; i++) {
              console.log('before push 4 block', killConditions[i]);
            }
            killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, false, null]);
            //////////console.log(`kill 4, killer ${k}, killed ${j}`);
            for (let i = 0; i < killConditions.length; i++) {
              console.log('after push 4 block', killConditions[i]);
            }
            //killSwitch(k, j, i, Pawns[k].isRed);
            killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
            playerHasKill = true;
            //killConditionsUnique = killUnique(killConditions);
            ////////console.log('push 4', killConditions.length);
            //for (let i = 0; i < killConditionsUnique.length; i++)
            //console.log('unique 4', killConditionsUnique[i]);
            
             
          }
        }
      }
      
      //break;
    }
    
  }

  
//q
  
  generateQueensAreas();
  console.log(`blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn}`);
  for (let i = 0; i < Board.length; i++) {
    
    let upLeftArray = [];
    let downRightArray = [];
    let upRightArray = [];
    for (let j = 0; j < Pawns.length; j++) {
      for (let k = 0; k < Pawns.length; k++) {
        if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            blockKilledPawn === null && blockKillersPawn === null && Board[i].queen && Pawns[j].row - Board[i].row <= -1 &&
            Pawns[j].column - Board[i].column >= 1 && Board[i].row > Pawns[j].row &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'down-left' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
          ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )
            &&
            Board.some(board =>
              board.free && board.queen &&
              Pawns[j].row - board.row == -1 &&
              Pawns[j].column - board.column == 1
            )  
        ) {

          console.log(`down left, k ${k}, j ${j}, i ${i}`);
          downLeftArray.push([k, j, i]);
          for (let i = 0; i < downLeftArray.length; i++) {
            console.log("push downLeftArray", downLeftArray[i]);
          }
          
          for (let i = 0; i < Board.length; i++)
            for (let j = 0; j < downLeftArray.length; j++)
              if (Board[i].row - Pawns[downLeftArray[j][1]].row == -1 && Board[i].column - Pawns[downLeftArray[j][1]].column == 1  
                && 
                !Pawns.some(yourPawn => 
                Pawns[downLeftArray[j][1]].isRed == yourPawn.isRed
                && yourPawn.live &&
                Board[i].column == yourPawn.column && Board[i].row == yourPawn.row
                
                )
              ) {
                console.log("check behind killed postions", downLeftArray[j][0], downLeftArray[j][1], downLeftArray[j][2]);
                //Board[i].check = true;
                // let queen = null;
                // let foundQueenNeighbor = downLeftArray.find(queenNeighbor =>
                //   Pawns[queenNeighbor[0]].row - Pawns[queenNeighbor[1]].row == -1 &&
                //   Pawns[queenNeighbor[0]].column - Pawns[queenNeighbor[1]].column == 1
                // );
                // if (foundQueenNeighbor) queen = foundQueenNeighbor[0];
                let rows = [];
                for (let i = 0; i < downLeftArray.length; i++)
                  rows.push(Pawns[downLeftArray[i][1].row])
                let nearest = Math.max(...rows); 
                killConditions.push([downLeftArray[j][0], downLeftArray[j][1], downLeftArray[j][2], Pawns[downLeftArray[j][0]].isRed, Greenturn, Pawns[downLeftArray[j][0]].rectCenter, Pawns[downLeftArray[j][0]].rectCenterY, Pawns[downLeftArray[j][1]].rectCenter, Pawns[downLeftArray[j][1]].rectCenterY, true, nearest]);
                killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
              }

          //killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, true, null]);      
          for (let j = 0; j < killConditions.length; j++) {
            console.log('killConditions', j, killConditions[j])
          }
          //killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
          for (let j = 0; j < killConditionsUnique.length; j++) {
            console.log('killConditionsUnique', j, killConditionsUnique[j]);
          }
          
        }
        else if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            (blockKilledPawn === k || blockKillersPawn === k) && Board[i].queen && Pawns[j].row - Board[i].row <= -1 &&
            Pawns[j].column - Board[i].column >= 1 && Board[i].row > Pawns[j].row &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'down-left' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
          ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )  
        ) {

          console.log(`down left block, k ${k}, j ${j}, i ${i}`);
          
          
          killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, true, null]);
          killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
        }
        if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            blockKilledPawn === null && blockKillersPawn === null && Board[i].queen && Board[i].free && Pawns[j].row - Board[i].row >= 1 &&
            Board[i].row < Pawns[j].row &&
            Pawns[j].column - Board[i].column >= 1 &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'up-left' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
            ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )   
        ) {

          console.log(`up left, k ${k}, j ${j}, i ${i}`);

          
          killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, true, null]);
          killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
        }
        else if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            (blockKilledPawn === k || blockKillersPawn === k) && Board[i].queen && Board[i].free && Pawns[j].row - Board[i].row >= 1 &&
            Board[i].row < Pawns[j].row &&
            Pawns[j].column - Board[i].column >= 1 &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'up-left' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
            ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )   
        ) {

          console.log(`up left block, k ${k}, j ${j}, i ${i}`);

          
          killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, true, null]);
          killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
        }
        if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            blockKilledPawn === null && blockKillersPawn === null && Board[i].queen && Board[i].free && Pawns[j].row - Board[i].row <= -1 &&
            Board[i].row > Pawns[j].row &&
            Pawns[j].column - Board[i].column <= -1 &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'down-right' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
            ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )   
        ) {

          console.log(`down right, k ${k}, j ${j}, i ${i}`);

          killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, true, null]);
          killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
        }
        else if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            (blockKilledPawn === k || blockKillersPawn === k) && Board[i].queen && Board[i].free && Pawns[j].row - Board[i].row <= -1 &&
            Board[i].row > Pawns[j].row &&
            Pawns[j].column - Board[i].column <= -1 &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'down-right' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
            ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )   
        ) {

          console.log(`down right block, k ${k}, j ${j}, i ${i}`);

          killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, true, null]);
          killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
        }
        if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            blockKilledPawn === null && blockKillersPawn === null && Board[i].queen && Board[i].free && Pawns[j].row - Board[i].row >= 1 &&
            Pawns[j].column - Board[i].column <= -1 && Board[i].row < Pawns[j].row &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'up-right' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
            ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )  
        ) {

          console.log(`up right, k ${k}, j ${j}, i ${i}`);

          killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, true, null]);
          killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
        }
        else if (Pawns[j].isRed != Pawns[k].isRed && Pawns[j].live && Pawns[k].live && Pawns[k].queen &&
          ((Player == 1 && Greenturn == false && Pawns[j].isRed == false) || (Player == 2 && Greenturn == true && Pawns[j].isRed == true)) &&
            (blockKilledPawn === k || blockKillersPawn === k) && Board[i].queen && Board[i].free && Pawns[j].row - Board[i].row >= 1 &&
            Pawns[j].column - Board[i].column <= -1 && Board[i].row < Pawns[j].row &&
            Pawns[k].queensAreas.some(area => 
              area[2] === 'up-right' &&
              Pawns[j].row === area[0] &&
              Pawns[j].column === area[1] 
            ) &&
            Pawns[k].queensAreas.some(area => 
              Board[i].free &&
              Board[i].row == area[0] &&
              Board[i].column == area[1] 
            )  
        ) {

          console.log(`up right block, k ${k}, j ${j}, i ${i}`);

          killConditions.push([k, j, i, Pawns[k].isRed, Greenturn, Pawns[k].rectCenter, Pawns[k].rectCenterY, Pawns[j].rectCenter, Pawns[j].rectCenterY, true, null]);
          killConditionsUnique = JSON.parse(JSON.stringify(killUnique(killConditions)));
        }
      
      }
    }
  }
          
      
      
      //break;
    
    
  
        
      
        
            
             
          


//k j i isred
  
  
    // //killConditionsUnique = killUnique(killConditions);
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killConditionsUnique)
  // for (let i = 0; i < killConditionsUnique.length; i++)
  //   killSwitch(killConditionsUnique[i][0], killConditionsUnique[i][1], killConditionsUnique[i][2], killConditionsUnique[i][3]);
  // Assuming killConditionsUnique is an array with length > 0
  for (let i = 0; i < killConditionsUnique.length; i++) {
    console.log("killConditionsUnique out", i, killConditionsUnique[i])
  }
  
    for (let i = 0; i < killConditionsUnique.length; i++) 
      for (let j = i + 1; j < killConditionsUnique.length; j++) 
        if (killConditionsUnique[i][0] != killConditionsUnique[j][0] && 
            killConditionsUnique[i][3] == killConditionsUnique[j][3] &&
            killConditionsUnique[i][1] == killConditionsUnique[j][1] &&
            Pawns[killConditionsUnique[i][1]].live && Pawns[killConditionsUnique[j][1]].live
          ) {
        
          console.log(`killersOptMode killer1: ${killConditionsUnique[i][0]} killer2: ${killConditionsUnique[j][0]} killed1: ${killConditionsUnique[i][1]} killed2: ${killConditionsUnique[j][1]}`);
          killersOptMode = true;
          blockKill = true;
          Pawns[killConditionsUnique[i][0]].killer = true;
          Pawns[killConditionsUnique[j][0]].killer = true;
          //Pawns[killConditionsUnique[1][0]].killer = true;
          killersOptModeArray.push(killConditionsUnique[i]);
          killersOptModeArray.push(killConditionsUnique[j]);
          //killersOptModeArray.push(killConditionsUnique[1]);
    
    // If you want to break the loop after the first match, uncomment the following line
    // break;
      }
      for (let i = 0; i < killConditionsUnique.length; i++) 
        for (let j = i + 1; j < killConditionsUnique.length; j++) 
          if (killConditionsUnique[i][0] != killConditionsUnique[j][0] && 
              killConditionsUnique[i][3] == killConditionsUnique[j][3] &&
              killConditionsUnique[i][1] != killConditionsUnique[j][1] &&
              Pawns[killConditionsUnique[i][1]].live && Pawns[killConditionsUnique[j][1]].live &&
              (!killConditionsUnique[j][9] && killConditionsUnique[i][10] != null) ||
              (killConditionsUnique[j][10] != null && !killConditionsUnique[i][9])
              
              
            ) {
              console.log(`killedOptMode killer1: ${killConditionsUnique[i][0]} killer2: ${killConditionsUnique[j][0]} killed1: ${killConditionsUnique[i][1]} killed2: ${killConditionsUnique[j][1]}`);
                killedOptMode = true;
                blockKill = true;
                Pawns[killConditionsUnique[i][1]].killed = true;
                Pawns[killConditionsUnique[j][1]].killed = true;
                killedOptModeArray.push(killConditionsUnique[i]);
                killedOptModeArray.push(killConditionsUnique[j]);
          } 
    for (let i = 0; i < killConditionsUnique.length; i++) 
      for (let j = i + 1; j < killConditionsUnique.length; j++)
        if (killConditionsUnique[i][0] == killConditionsUnique[j][0] && 
            killConditionsUnique[i][3] == killConditionsUnique[j][3] &&
            killConditionsUnique[i][1] != killConditionsUnique[j][1] &&
            Pawns[killConditionsUnique[i][1]].live && Pawns[killConditionsUnique[j][1]].live &&
            !killConditionsUnique[i][9]) {
              console.log(`oneKiller2Killed killer1: ${killConditionsUnique[i][0]} killer2: ${killConditionsUnique[j][0]} killed1: ${killConditionsUnique[i][1]} killed2: ${killConditionsUnique[j][1]}`);
              oneKiller2Killed = true;
              blockKill = true;
              Pawns[killConditionsUnique[j][1]].kill1Killed2 = true;
              Pawns[killConditionsUnique[i][1]].kill1Killed2 = true;
              oneKiller2KilledArray.push(killConditionsUnique[i]);
              oneKiller2KilledArray.push(killConditionsUnique[j]);
              //console.log('multi');
        }
 


}
  
 
  // for (let i = 0; i < killConditionsUnique.length - 1; i++) 
  //   if (killConditionsUnique[i][0] == killConditionsUnique[i + 1][0] && killConditionsUnique[i][1] == killConditionsUnique[i + 1][1]) {
  //     //////////////////////////////////////////////////////////////////////////////////////////////////////////////console.log("killedOpt");
  //   }
  ////console.log('check kill 2', killConditionsUnique.length);

// k j i
let lastMove = false;
let multiKill = false;
function killOpt(killmode) {
  for (let z = 0; z < killmode.length; z++) {
    //console.log(`killOpt - killer: ${killmode[z][0]} killed: ${killmode[z][1]}`);
  }
  ////console.log('check killOpt 1', killConditionsUnique.length);
  //console.log(`killOpt: killedOptMode ${killedOptMode} killersOptMode ${killersOptMode} oneKiller2Killed ${oneKiller2Killed} 
  //blockKill ${blockKill} blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn} releaseBlock ${releaseBlock}`)
  if (releaseBlock) {
    killmode = [];
    releaseBlock = false;
    ////console.log('releaseBlock killOpt if false', releaseBlock)
  }
  for (let i = 0; i < killmode.length; i++)  
    if ((!killersOptMode && !killedOptMode && !oneKiller2Killed) &&
        ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) && blockKill &&
      ((blockKilledPawn != null && killmode[i][0] != blockKilledPawn) || (blockKillersPawn != null && killmode[i][0] != blockKillersPawn))) 
      killmode.splice(i, 1)
    for (let i = 0; i < killmode.length; i++)
        if (((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) &&  
           !blockKill && (!killersOptMode && !killedOptMode && !oneKiller2Killed) && Pawns[killmode[i][1]].live) {
          //console.log('check killOpt condition 1', killmode[i]);
          killSwitch(killmode[i][0],killmode[i][1],killmode[i][2],killmode[i][3]);
          
          break;
        }
        else if (((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) && blockKill && ((killmode[i][0] == blockKilledPawn) || (killmode[i][0] == blockKillersPawn)) &&
        (!killersOptMode && !killedOptMode && !oneKiller2Killed) && Pawns[killmode[i][1]].live) {
          //console.log('check killOpt 2', killmode[i]);
          killSwitch(killmode[i][0],killmode[i][1],killmode[i][2],killmode[i][3]);
          
          break;
        }
        ////console.log('check killOpt 2', killConditionsUnique.length);
        
}

function killSwitch(winner, looser, newBoard, player) {
  
  ////console.log('check killSwitch 1', killConditionsUnique.length);
  //console.log(`killSwitch: killedOptMode ${killedOptMode} killersOptMode ${killersOptMode} oneKiller2Killed ${oneKiller2Killed} 
  //blockKill ${blockKill} blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn} releaseBlock ${releaseBlock}`)
  if ((!killersOptMode && !killedOptMode && !oneKiller2Killed) && Pawns[looser].live) {
  for (let m = 0; m < Board.length; m++)
    if (Board[m].row == Pawns[winner].row && Board[m].column == Pawns[winner].column) Board[m].free = true;
  for (let m = 0; m < Board.length; m++)
    if (Board[m].row == Pawns[looser].row && Board[m].column == Pawns[looser].column) Board[m].free = true;
 
  let pawnLetter = Pawns[winner].letter;
  let pawnNumber = Pawns[winner].number;
  let pawnLetterLooser = Pawns[looser].letter;
  let pawnNumberLooser = Pawns[looser].number;
  let played = Pawns[winner].isRed;
  message = "kill";
  if ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn) && Pawns[looser].live)
    socket.emit('message kill', message, played, pawnLetter, pawnNumber, pawnLetterLooser, pawnNumberLooser, room);
  Pawns[looser].live = false;
 
  Pawns[winner].row = Board[newBoard].row;
  Pawns[winner].column = Board[newBoard].column;
  Pawns[winner].letter = Board[newBoard].letter;
  Pawns[winner].number = Board[newBoard].number;
  
  Board[newBoard].free = false;
  checkQueen();
  
  current = winner;
 
  kill(blockKilledPawn, blockKillersPawn);
  
  
  }
  
  ////console.log('check killSwitch 2', killConditionsUnique.length); 
}
let step = 0;
function stepKill(killmode) {
  ////console.log('check stepKill 1', killConditionsUnique.length); 
  ////////////////////////////////////////////////for (let z = 0; z < killmode.length; z++)////////////////////console.log(`killer: ${killmode[z][0]} killed: ${killmode[z][1]}`);
  for (let z = 0; z < killmode.length; z++) {
    //console.log(`stepKill - killer: ${z} ${killmode[z][0]} killed: ${killmode[z][1]}`);
  }
  
  // for (let i = 0; i < killmode.length; i++)
  //   if (killmode.length > 1 && blockKilledPawn == blockKillersPawn && blockKilledPawn != null && blockKillersPawn != null) {
  //     //console.log("block collision", blockKilledPawn, blockKillersPawn)
  //     blockKillersPawn = null;
  //     killmode.splice(i, 1);
  //     break;
      
  //   }
  
  //console.log(`stepKill: killedOptMode ${killedOptMode} killersOptMode ${killersOptMode} oneKiller2Killed ${oneKiller2Killed} 
  //blockKill ${blockKill} blockKilledPawn ${blockKilledPawn} blockKillersPawn ${blockKillersPawn} releaseBlock ${releaseBlock}`)
  if (killmode.length == 0) step = 0;
  let killer;
  if (releaseBlock) {
    killmode = [];
    releaseBlock = false;
    ////console.log('releaseBlock stepKill if false', releaseBlock)
  }
    for (let i = 0; i < killmode.length; i++) 
    if (blockKill && ((blockKilledPawn != null && killmode[i][0] != blockKilledPawn) ||
    (blockKillersPawn != null && killmode[i][0] != blockKillersPawn))) {
        killmode.splice(i, 1);
        //console.log(`stepkill out filter - blockKill: ${blockKill}, blockKilledPawn: ${blockKilledPawn}, blockKillersPawn: ${blockKillersPawn}`)
        //console.log('kilmode[i]', killmode[i]);
    }
    
  
////////////////////////////////////////////////////console.log(`killer: ${killmode[i][0]}, killed: ${killmode[i][1]}, turn: ${killmode[i][4]}, check: ${check}`);
//////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killersOptMode);
////////////////////console.log('stepKill out', killmode);
// for (let i = 0; i < killmode.length; i++)
//   if (blockKill && blockKilledPawn != killmode[i][0] && blockKilledPawn != null) 
//     killmode.splice(i, 1);
//for (let z = 0; z < killmode.length; z++)////////////////////console.log(`killer: ${killmode[z][0]} killed: ${killmode[z][1]}`);
//////////////////////////////////console.log(`killersOptMode: ${killersOptMode} killedOptMode: ${killedOptMode}`);


for (let i = 0; i < killmode.length; i++)
if (((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) && (!killersOptMode && !killedOptMode && (!oneKiller2Killed || (oneKiller2Killed && step == 0))) && !Pawns[killmode[i][1]].live)   
  //if (Pawns[killmode[i][0]].live && !Pawns[killmode[i][1]].live ) 
{ 
  step++;
  //console.log("step", step);
  //console.log("stepKill in", killmode[i]);
  let targetPos = createVector(Board[killmode[i][2]].rectCenter, Board[killmode[i][2]].rectCenterY);
  let movingPawnOldPos = { x: Pawns[killmode[i][0]].rectCenter, y: Pawns[killmode[i][0]].rectCenterY };
  killer = killmode[i][0];
  Pawns[killmode[i][0]].targetPos = targetPos;
  if (Pawns[killmode[i][0]].live) movingPawn = Pawns[killmode[i][0]];
  isPawnMoving = true;
  ////////////////////////////////////////////////////////////////////////////////////////////////////////console.log(killmode.length);
  
  
  ////////////////////console.log('step');
  ////////////////////console.log(`killer ${killmode[i][0]} killed ${killmode[i][1]}`);
  //for (let z = 0; z < killmode.length; z++)////////////////////console.log(`killer: ${killmode[z][0]} killed: ${killmode[z][1]}`);
  let animatedPawn = killmode[i][0]
  // if (blockKill && killmode.length > 0 && killmode.every(kill => kill[0] != blockKilledPawn)) {
  //   blockKill = false;
  //   blockKilledPawn = null;
  //   ////////////////////console.log("check");
  //   ////////////////////console.log(killmode);
  // }
  
  // if (killConditionsUnique.length > 1 && !blockKill) check = true;
  // else if (killConditionsUnique.length <= 1 && !blockKill) check = false;
  // else if (blockKill && killmode.every(kill => kill[0] != blockKilledPawn) && blockKilledPawn != null) {
  //   blockKill = false;
  //   blockKilledPawn = null;
  //   check = false;
  //   ////////////////////console.log('blockKill false:', killmode) 
  //   // socket.emit('turn', Greenturn, check, room);
  // }
  // else if (blockKill) check = true;
  for (let i = 0; i < killmode.length; i++)
    for (let j = 0; j < killConditions.length; j++)
      if (killmode[i][0] == killer && killConditions[j][0] == killer && killmode[i][1] == killConditions[j][1]) {
        killConditions.splice(j, 1)
        break;  
      }
  //generateQueensAreas(killmode[i][0]);
  killmode.splice(i, 1);
  //generateQueensAreas();
  //socket.emit('killed mode', killedOptMode, Pawns, room);
  socket.emit('state', Board, Pawns, Greenturn, check, current, room);
  socket.emit('move', { 
    x: targetPos.x, 
    y: targetPos.y, 
    oldX: movingPawnOldPos.x, 
    oldY: movingPawnOldPos.y 
  }, room, animatedPawn);
  //generateQueensAreas()
  break;
}
    //killmode = [];
    //////////////console.log(`blockKill ${blockKill} blockKillersPawn ${blockKillersPawn} blockKilledPawn ${blockKilledPawn}`)
    
 
    // for (let i = 0; i < killConditionsUnique.length; i++) {
    //     for (let j = 0; j < killmode.length; j++) 
    //         if (killConditionsUnique[i][0] != killConditionsUnique[j][0]) 
    //             //killConditionsUnique.splice(i, 1);
    // }        
    
        
    // step++;
    ////////console.log('step', step)    
    for (let i = 0; i < killConditions.length; i++) {
        ////////console.log('orginal', i, killConditions[i]);
    }
    for (let x = 0; x < killConditionsUnique.length; x++) {
        ////////console.log('unique', killConditionsUnique[x]);
    }
    
    if (killConditionsUnique.length > 0 && !blockKill) {
        check = true;
        
        ////////console.log('killConditionsUnique.length > 0', check)
    }
    else if (killConditionsUnique.length == 0 && !blockKill) {
        check = false;
        killConditions = [];
        ////////console.log('killConditionsUnique.length == 0', check)
    }
    else if ((blockKill && killConditionsUnique.length == 0 && blockKillersPawn != null)) {
        check = false;
        
        blockKill = false;
        blockKillersPawn = null;
        releaseBlock = true;
        killConditions = [];
        //console.log('releaseBlock stepKill else if (blockKill && killConditionsUnique.length == 0 && blockKillersPawn != null)', releaseBlock)
        //////////console.log('blockKill false killers empty killConditionsUnique:', killmode)     
    }
    else if (blockKillersPawn != null && blockKillersPawn == blockKilledPawn) {
      blockKillersPawn = null;
      killConditions = [];
      //console.log('block collision');
    }
    else if (blockKill && killConditionsUnique.length == 0 && blockKilledPawn != null) {
        
        check = false;
        
        blockKill = false;
        blockKilledPawn = null;
        releaseBlock = true;
        killConditions = [];
        //console.log('releaseBlock stepKill else if (blockKill && killConditionsUnique.length == 0 && blockKilledPawn != null)', releaseBlock)

        //////////console.log('blockKill false killers empty killConditionsUnique:', killmode)     
    }
    else if (blockKill && killConditionsUnique.length > 0 && killConditionsUnique.every(kill => kill[0] != blockKilledPawn) && blockKilledPawn != null &&
        ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) ) {
        check = false;
        
        blockKill = false;
        blockKilledPawn = null;
        releaseBlock = true;
        killConditions = [];
        //console.log('releaseBlock stepKill else if (blockKill && killConditionsUnique.length > 0 && killConditionsUnique.every(kill => kill[0] != blockKilledPawn) && blockKilledPawn != null)', releaseBlock)
        //////////console.log('blockKill false killed:', killmode) 
        //socket.emit('blockKill false', blockKill, blockKilledPawn, releaseBlock, killmode, room);
    }
    else if (blockKill && killConditionsUnique.length > 0 && killConditionsUnique.every(kill => kill[0] != blockKillersPawn) && blockKillersPawn != null &&
    ((Player == 1 && !Greenturn) || (Player == 2 && Greenturn)) ) {
        check = false;
        
        blockKill = false;
        blockKillersPawn = null;
        releaseBlock = true;
        killConditions = [];
        //console.log('releaseBlock stepKill else if (blockKill && killConditionsUnique.length > 0 && killConditionsUnique.every(kill => kill[0] != blockKillersPawn) && blockKillersPawn != null)', releaseBlock)
        //////////console.log('blockKill false killers other killers:', killmode) 
        //socket.emit('blockKill false', blockKill, blockKilledPawn, releaseBlock, killmode, room);
    }
    else if (blockKill) {
        check = true;
        
        //console.log('else if (blockKill)', check)
    }
    // else {
    //     check = false;
    //     //////////console.log('else', check)
    // }
    //////////console.log('after ifs', check);
    ////console.log('check stepKill 2', killConditionsUnique.length);    
}


function killUnique(array) {
    let uniqueKills = [];
    let itemsFound = {};
    for (let i = 0; i < array.length; i++) {
        // Create a copy of the array element excluding indices 5 and 6
        let modifiedArray = array[i].filter((_, index) => index !== 5 && index !== 6 && index !== 7 && index !== 8);
        let stringified = JSON.stringify(modifiedArray);
        if (itemsFound[stringified]) {
            continue;
        }
        uniqueKills.push(array[i]);
        itemsFound[stringified] = true;               //(!array[9] && index !== 5 && index !== 6) || (array[9] && index !== 5 && index !== 6 && index !== 7 && index !== 8));
    }
    return uniqueKills;
}

function queenUnique(array) {
  let uniqueKills = [];
  let itemsFound = {};
  for (let i = 0; i < array.length; i++) {
      let stringified = JSON.stringify(array[i]);
      if (itemsFound[stringified]) {
          continue;
      }
      uniqueKills.push(array[i]);
      itemsFound[stringified] = true;
  }
  return uniqueKills;
}


function mousePressed() {
    if (mouseButton === RIGHT) {
      
      let X = mouseX;
      let Y = mouseY;
      for (let i = 0; i < Board.length; i++)
        if (X > Board[i].rectCenter - 32 && X < Board[i].rectCenter + 32 &&
            Y > Board[i].rectCenterY - 32 && Y < Board[i].rectCenterY + 32) {
          console.log("b i " + i);
          console.log(Board[i]);
          //Board[i].free = true;
          
      }
      for (let i = 0; i < Pawns.length; i++) {
        let p = Pawns[i];
        if (X > p.rectCenter - 32 && X < p.rectCenter + 32 && Y > p.rectCenterY - 32 && Y < p.rectCenterY + 32) {
         console.log("p i " + i)
         console.log(Pawns[i]);
         //Pawns[i].live = false;
        }
      }
    }
  }

function checkQueen () {
  for (let i = 0; i < Pawns.length; i++)
    if ((Pawns[i].isRed && Pawns[i].row == 8) || (!Pawns[i].isRed && Pawns[i].row == 1))
      Pawns[i].queen = true;
}

function generateQueensAreas() {
  for (let i = 0; i < Pawns.length; i++) {
    if (Pawns[i].queen && Pawns[i].live) {
      Pawns[i].queensAreas = [];
      
      // Define directions for queen movement
      const directions = [
        { row: 1, column: 1, dir: "down-right" },    // Diagonal down-right
        { row: -1, column: -1, dir: "up-left" },  // Diagonal up-left
        { row: -1, column: 1, dir: "up-right" },   // Diagonal up-right
        { row: 1, column: -1, dir: "down-left" }    // Diagonal down-left
      ];
      
      for (const direction of directions) {
        let tempRow = Pawns[i].row;
        let tempColumn = Pawns[i].column;

        for (let j = 0; j < 7; j++) {
          tempRow += direction.row;
          tempColumn += direction.column;

          // Check if the position is within bounds and not occupied by another pawn
          const isOccupied = Pawns.some(pawn => pawn.row === tempRow && pawn.column === tempColumn && pawn.live && Pawns[i].isRed == pawn.isRed);
          if (isOccupied) break;

          Pawns[i].queensAreas.push([tempRow, tempColumn, direction.dir]);
        }
      }
    }
  }

  // Reset all board queens
  for (let j = 0; j < Board.length; j++) {
    Board[j].queen = false;
  }

  // Mark board positions as queen areas
  for (let i = 0; i < Pawns.length; i++) {
    if (Pawns[i].live) {
      for (let k = 0; k < Pawns[i].queensAreas.length; k++) {
        const [row, column] = Pawns[i].queensAreas[k];
        const boardIndex = Board.findIndex(board => board.row === row && board.column === column);
        if (boardIndex !== -1) {
          Board[boardIndex].queen = true;
        }
      }
    }
  }
  
  //console.log(Pawns[9]);
}

// Call the function to generate queen areas


// Output the result
////console.log(Pawns[9]);