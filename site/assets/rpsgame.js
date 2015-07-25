"use strict";

var gameCanvas = document.getElementById("rpsgame");
var context = gameCanvas.getContext("2d");
context.fillStyle = "rgb(255, 255, 255)";
context.font = "13px Inconsolata, Consolas, monospace";
context.textAlign = "left";
context.textBaseline = "top";

var startMessage = "CLICK TO BEGIN (Instructions Below)";
var startMessageWidth = context.measureText(startMessage).width;
var startMessagePos = startMessageWidth < 250 ? 0.5 * gameCanvas.width - 0.5 * startMessageWidth : 25;
context.fillText(startMessage, startMessagePos, 0.5 * gameCanvas.height, 250);
var roundMessage, roundMessageWidth, roundMessagePos;
var gameOver = "GAME OVER";
var gameOverWidth = context.measureText(gameOver).width;

var enemyImgARaw = new Image();
enemyImgARaw.src = "/assets/enemyA.png";
var enemyImgBRaw = new Image();
enemyImgBRaw.src = "/assets/enemyB.png";
var enemyImgCRaw = new Image();
enemyImgCRaw.src = "/assets/enemyC.png";
var enemyBulletImgRaw = new Image();
enemyBulletImgRaw.src = "/assets/enemybullet.png";

var gameState = {
  player: null,
  comp: null,
  playerScore: 0,
  compScore: 0,
  activeBullet: null,
  animating: false,
  playing: false,
  started: false,
  playerSees: false,
  compSees: false,
  compChoose: null,
  loopAge: null,
  loop: null,
  point: {x: null, y: null, width: 1, height: 1},
  enemyImgA: enemyImgARaw,
  enemyImgB: enemyImgBRaw,
  enemyImgC: enemyImgCRaw,
  enemyBulletImg: enemyBulletImgRaw,
  drawAndUpdate: null,
  collides: function (a, b) {
    return (a.x < b.x + b.width && a.x + a.width > b.x &&
            a.y < b.y + b.height && a.y + a.height > b.y);
  }
};

function shuffled(list) {
  var currentIndex, temp, randomIndex;
  for (currentIndex = list.length - 1; currentIndex > 0; currentIndex -= 1) {
    randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    temp = list[currentIndex];
    list[currentIndex] = list[randomIndex];
    list[randomIndex] = temp;
  }
  return list;
}

function Bullet(speed, x, y) {
  var ctx = context;
  
  this.speed = speed;
  this.x = x;
  this.y = y;
  
  this.live = true;
  this.width = 10;
  this.height = 10;
  this.yVelocity = this.speed;
  this.img = gameState.enemyBulletImg;
  
  this.draw = function () {
    ctx.drawImage(this.img, this.x, this.y);
  };
  
  this.update = function () {
    this.y += this.yVelocity;
  };
}

function ActiveShip(model, ofPlayer) {
  var ctx = context;
  
  this.id = model.id;
  this.num = model.num;
  if (this.id === "Scissors") {
    this.x = 116;
  } else {
    this.x = 111;
  }
  if (ofPlayer) {
    this.y = 270; //230 290
  } else {
    this.y = 80; //130 60
  }
  this.img = model.img;
  this.width = model.width;
  this.height = model.height;
  
  this.draw = function () {
    ctx.drawImage(this.img, this.x, this.y);
  };
  
  this.beats = function (other) {
    return ((this.id === "Scissors" && other.id === "Paper") ||
            (this.id === "Paper" && other.id === "Rock") ||
            (this.id === "Rock" && other.id === "Scissors"));
  };
}

function Reserve(x, y, id, stock) {
  var ctx = context;
  var gs = gameState;
  
  this.id = id;
  this.x = x;
  this.y = y;
  switch (this.id) {
  case "Rock":
    this.img = gs.enemyImgB;
    this.num = 0;
    break;
  case "Paper":
    this.img = gs.enemyImgC;
    this.num = 1;
    break;
  case "Scissors":
    this.img = gs.enemyImgA;
    this.num = 2;
    break;
  }
  this.width = this.img.width;
  this.height = this.img.height;
  this.stock = stock;
  
  this.draw = function () {
    if (this.stock > 0) {
      if (this.y < 200 && !gs.playerSees) {
        ctx.fillText(this.id + ": ?", this.x, this.y - 20, 75);
      } else {
        ctx.fillText(this.id + ": " + this.stock, this.x, this.y - 20, 75);
      }
      ctx.drawImage(this.img, this.x, this.y);
    } else {
      ctx.fillText(this.id + ": 0", this.x, this.y - 20, 75);
    }
  };
  
  this.deploy = function (fleet, ofPlayer) {
    fleet.active = new ActiveShip(this, ofPlayer);
  };
}

function Fleet(y) {
  var gs = gameState;
  
  this.y = y;
  this.gap = 18;
  this.active = null;
  
  this.makeFleet = function () {
    this.ships = [];
    var stock1 = 3;
    var stock2 = 3;
    var stock3 = 3;
    var i;
    for (i = 0; i < 6; i += 1) {
      var extra = Math.ceil(Math.random() * 3);
      switch (extra) {
      case 1:
        stock1 += 1;
        break;
      case 2:
        stock2 += 1;
        break;
      case 3:
        stock3 += 1;
        break;
      }
    }
    this.ships.push(new Reserve(this.gap, this.y, "Rock", stock1));
    this.ships.push(new Reserve(2 * this.gap + 80, this.y, "Paper", stock2));
    this.ships.push(new Reserve(3 * this.gap + 160, this.y, "Scissors", stock3));
  };
  
  this.draw = function () {
    this.ships.forEach(function (ship) {
      ship.draw();
    });
  };
  
  this.loses = function () {
    return (this.ships[0].stock === 0 || this.ships[1].stock === 0 || this.ships[2].stock === 0);
  };
}

gameState.showInfo = function () {
  var gs = gameState;
  var ctx = context;
  ctx.fillText('Player victories: ' + gs.playerScore, 18, 270, 200);
  ctx.fillText('Enemy victories: ' + gs.compScore, 18, 20, 200); // 120
};

gameState.compChoose = function () {
  var rockStockPlayer, paperStockPlayer, scissorsStockPlayer, totalStock, selection, badChoice, index;
  var rockStock = this.comp.ships[0].stock;
  var paperStock = this.comp.ships[1].stock;
  var scissorsStock = this.comp.ships[2].stock;
  this.compSees = Math.random() < 0.20 ? true : false;
  if (this.compSees && (rockStock > 1) && (paperStock > 1) && (scissorsStock > 1)) {
    rockStockPlayer = this.player.ships[0].stock;
    paperStockPlayer = this.player.ships[1].stock;
    scissorsStockPlayer = this.player.ships[2].stock;
    totalStock = rockStockPlayer + paperStockPlayer + scissorsStockPlayer;
    selection = Math.ceil(Math.random() * totalStock);
    if (selection <= rockStock) {
      index = 1;
    } else if (selection <= rockStock + paperStock) {
      index = 2;
    } else {
      index = 0;
    }
  } else {
    totalStock = rockStock + paperStock + scissorsStock;
    selection = Math.ceil(Math.random() * totalStock);
    if (selection <= rockStock) {
      index = 0;
    } else if (selection <= rockStock + paperStock) {
      index = 1;
    } else {
      index = 2;
    }
  }
  if (this.comp.ships[index].stock === 1 && (rockStock > 1 || paperStock > 1 || scissorsStock > 1)) {
    badChoice = true;
    while (badChoice) {
      index = (Math.random() < 0.5 ? index + 1 : index + 2) % 3;
      if (this.comp.ships[index].stock > 1) {
        badChoice = false;
      }
    }
  }
  return this.comp.ships[index];
};

function endRound() {
  var gc = gameCanvas;
  var gs = gameState;
  var ctx = context;
  ctx.clearRect(0, 0, gc.width, gc.height);
  if (gs.player.loses() && gs.comp.loses()) {

  } else if (gs.player.loses()) {
    gs.compScore += 1;
  } else if (gs.comp.loses()) {
    gs.playerScore += 1;
  }
  window.setTimeout(main, 500);
}

function fightLoop() {
  var stockList, i;
  var ctx = context;
  var gs = gameState;
  var gc = gameCanvas;
  var playerActive = gs.player.active;
  var compActive = gs.comp.active;
  gs.loop = window.setTimeout(fightLoop, 25);
  gs.loopAge += 25;
  
  if (gs.loopAge === 100) {
    var cship = gs.compChoose();
    cship.deploy(gs.comp, false);
    compActive = gs.comp.active;
    ctx.clearRect(0, 0, gc.width, gc.height);
    playerActive.draw();
    compActive.draw();
  } else if (gs.loopAge === 1000) {
    ctx.clearRect(0, 0, gc.width, gc.height);
    if (playerActive.beats(compActive)) {
      gs.comp.ships[compActive.num].stock -= 1;
      playerActive.draw();
    } else if (compActive.beats(playerActive)) {
      gs.player.ships[playerActive.num].stock -= 1;
      compActive.draw();
    } else {
      gs.player.ships[playerActive.num].stock -= 1;
      gs.comp.ships[compActive.num].stock -= 1;
    }
  } else if (gs.loopAge === 2000) {
    ctx.clearRect(0, 0, gc.width, gc.height);
    window.clearTimeout(gs.loop);
    if (gs.player.loses() || gs.comp.loses()) {
      roundMessage = "---- END OF ROUND ----";
      roundMessageWidth = ctx.measureText(roundMessage).width;
      roundMessagePos = roundMessageWidth < 200 ? 0.5 * gc.width - 0.5 * roundMessageWidth : 50;
      gs.playerSees = true;
      ctx.fillText(roundMessage, roundMessagePos, 0.5 * gc.height, 200);
      window.setTimeout(endRound, 1500);
    } else {
      gs.animating = false;
      if (gs.playerSees) {
        stockList = [];
        for (i = 0; i < 3; i += 1) {
          stockList.push(gs.comp.ships[i].stock);
        }
        stockList = shuffled(stockList);
        for (i = 0; i < 3; i += 1) {
          gs.comp.ships[i].stock = stockList[i];
        }
      }
      if (gs.compSees) {
        window.console.log('Swapped');
        stockList = [];
        for (i = 0; i < 3; i += 1) {
          stockList.push(gs.player.ships[i].stock);
        }
        stockList = shuffled(stockList);
        for (i = 0; i < 3; i += 1) {
          gs.player.ships[i].stock = stockList[i];
        }
      }
      gs.playerSees = Math.random() < 0.20 ? true : false;
    }
    gs.player.draw();
    gs.comp.draw();
    gs.showInfo();
  }
}

function main() {
  var gs = gameState;
  
  gs.animating = false;
  gs.player = new Fleet(310);
  gs.comp = new Fleet(60); // 40
  gs.player.makeFleet();
  gs.comp.makeFleet();
  
  gs.playerSees = Math.random() < 0.20 ? true : false;
  context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  gs.player.draw();
  gs.comp.draw();
  gs.showInfo();
}

function click(e) {
  var gs = gameState;
  if (!gs.started) {
    gs.playing = true;
    gs.started = true;
    main();
  } else if (!gs.animating) {
    gs.point.x = e.layerX;
    gs.point.y = e.layerY;
    gs.player.ships.forEach(function (pship) {
      if (gs.collides(gs.point, pship) && pship.stock > 0) {
        gs.loopAge = -25;
        gs.animating = true;
        pship.deploy(gs.player, true);
        fightLoop();
      }
    });
  }
}

gameCanvas.addEventListener("click", click);