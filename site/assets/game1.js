"use strict";

try {
  var enviro = flock.init();
  enviro.start();
  var randomSynth = flock.synth({
    synthDef: {
      ugen: "flock.ugen.impulse",
      mul: 0.25,
      freq: {
        ugen: "flock.ugen.lfNoise",
        freq: 8,
        mul: 220,
        add: 220
      }
    },
    addToEnvironment: false
  });
  var bossSynth = flock.synth({
    synthDef: {
      ugen: "flock.ugen.lfPulse",
      width: 0.25,
      freq: {
        ugen: "flock.ugen.lfNoise",
        freq: 4,
        mul: 22.7817,
        add: 55
      },
      mul: {
        ugen: "flock.ugen.asr",
        attack: 0.001,
        sustain: 0.25,
        release: 0.1,
        gate: {
          ugen: "flock.ugen.impulse",
          rate: "control",
          freq: 4,
          phase: 1.0
        }
      }
    },
    addToEnvironment: false
  });
  var explodeSynthObj = {
    synthDef: {
      ugen: "flock.ugen.lfNoise",
      freq: 2000,
      mul: {
        ugen: "flock.ugen.asr",
        attack: 0.001,
        sustain: 0.25,
        release: 0.5,
        gate: {
          ugen: "flock.ugen.inputChangeTrigger",
          source: 1,
          duration: 0
        }
      }
    }
  };
} catch (e) {
  window.console.info(e);
  var flock = {
    synth: function (a) {}
  };
  var enviro = {
    start: function () {},
    stop: function () {}
  };
  var randomSynth = {
    play: function () {},
    pause: function () {}
  };
  var bossSynth = randomSynth;
  var explodeSynthObj = {};
}

var gameCanvas = document.getElementById("game1");
var context = gameCanvas.getContext("2d");
context.fillStyle = "rgb(255, 255, 255)";
context.font = "17px Inconsolata, Consolas, monospace";
context.textAlign = "left";
context.textBaseline = "top";

var startMessage = "CLICK TO BEGIN (Instructions Below)";
var startMessageWidth = context.measureText(startMessage).width;
context.fillText(startMessage, 0.5 * gameCanvas.width - 0.5 * startMessageWidth, 0.5 * gameCanvas.height);
var gameOver = "GAME OVER";
var gameOverWidth = context.measureText(gameOver).width;

var playerImgRaw = new Image();
playerImgRaw.src = "/assets/D-M.png";
var enemyImgRaw = new Image();
enemyImgRaw.src = "/assets/enemyA.png";
var enemyImgBRaw = new Image();
enemyImgBRaw.src = "/assets/enemyB.png";
var enemyImgCRaw = new Image();
enemyImgCRaw.src = "/assets/enemyC.png";
var bossImgRaw = new Image();
bossImgRaw.src = "/assets/boss.png";

var playerBulletImgRaw = new Image();
playerBulletImgRaw.src = "/assets/bullet.png";
var enemyBulletImgRaw = new Image();
enemyBulletImgRaw.src = "/assets/enemybullet.png";

var gameState = {
  playerBullets: [],
  enemies: [],
  enemyBullets: [],
  tempList: [],
  playing: false,
  started: false,
  loop: null,
  fireLoop: null,
  firing: false,
  gameAge: 1,
  fightingBoss: false,
  playerImg: playerImgRaw,
  enemyImg: enemyImgRaw,
  enemyImgB: enemyImgBRaw,
  enemyImgC: enemyImgCRaw,
  bossImg: bossImgRaw,
  playerBulletImg: playerBulletImgRaw,
  enemyBulletImg: enemyBulletImgRaw,
  drawAndUpdate: null,
  handleCollisions: null,
  collides: function (a, b) {
    return (a.x < b.x + b.width && a.x + a.width > b.x &&
            a.y < b.y + b.height && a.y + a.height > b.y &&
            !b.dying);
  },
  hitboxCollides: function (a, b) {
    return (b.centerX - 1 < a.x + a.width && b.centerX + 1 > a.x &&
            b.centerY - 1 < a.y + a.height && b.centerY + 1 > a.y &&
            !a.dying);
  },
  circleCollides: function (a, b) {
    var dx = b.centerX - a.centerX;
    var dy = b.centerY - a.centerY;
    return (Math.sqrt((dx * dx) + (dy * dy)) < a.radius + b.radius);
  }
};

// angle as side for player bullets
function Bullet(speed, x, y, angle) {
  var gc = gameCanvas;
  this.rightLim = gc.width;
  this.bottomLim = gc.height;
  
  this.speed = speed;
  this.x = x;
  this.y = y;
  
  this.active = true;
  this.width = 10;
  this.height = 10;
  
  if (this.speed < 0) {
    this.age = 0;
    this.xVelocity = 0;
    this.yVelocity = this.speed;
    this.side = angle;
    this.img = gameState.playerBulletImg;
  } else {
    this.angle = angle;
    this.dying = false;
    this.radius = 5;
    this.xVelocity = this.speed * Math.sin(this.angle * Math.PI / 180);
    this.yVelocity = this.speed * Math.cos(this.angle * Math.PI / 180);
    this.centerX = this.x + 5;
    this.centerY = this.y + 5;
    this.img = gameState.enemyBulletImg;
  }
}
Bullet.prototype.inBounds = function () {
  return (this.x >= -10 && this.x <= this.rightLim &&
          this.y >= -10 && this.y <= this.bottomLim);
};
Bullet.prototype.draw = function () {
  context.drawImage(this.img, this.x, this.y);
};
Bullet.prototype.update = function () {
  if (this.speed < 0) {
    this.xVelocity = this.side * 5 * Math.cos(45 * this.age * Math.PI / 180);
    this.age += 1;
  }
  this.x += this.xVelocity;
  this.y += this.yVelocity;
  this.centerX += this.xVelocity;
  this.centerY += this.yVelocity;
  this.active = this.active && this.inBounds();
};

var player = {
  score: 0,
  maxHealth: 1,
  health: 1,
  x: 225,
  y: 970,
  width: 50,
  height: 61,
  centerX: 250,
  centerY: 1000,
  radius: -1,
  movingLeft: false,
  movingRight: false,
  movingUp: false,
  movingDown: false,
  fast: true,
  explode: function () {
    gameState.playing = false;
  },
  getBullet: function () {
    var gs = gameState;
    var bulletPositionX = this.centerX - 5;
    var bulletPositionY = this.y - 10;
    gs.playerBullets.push(new Bullet(-20, bulletPositionX, bulletPositionY, -1));
    gs.playerBullets.push(new Bullet(-20, bulletPositionX, bulletPositionY, 1));
  }
};

function setPlayerRect(e) {
  var pl = player;
  pl.centerX = e.layerX;
  pl.centerY = e.layerY;
  pl.x = pl.centerX - 0.5 * pl.width;
  pl.y = pl.centerY - 0.5 * pl.height;
}
player.movePlayer = function () {
  var gc = gameCanvas;
  var moveY = 0;
  var moveX = 0;
  var moveSpeed = this.fast ? 9 : 3;
  if (this.movingDown && this.centerY <= gc.height) {
    moveY = moveSpeed;
  }
  if (this.movingUp && this.centerY >= 0) {
    moveY = -moveSpeed;
  }
  if (this.movingLeft && this.centerX >= 0) {
    moveX = -moveSpeed;
  }
  if (this.movingRight && this.centerX <= gc.width) {
    moveX = moveSpeed;
  }
  if (moveX !== 0 && moveY !== 0) {
    moveX *= Math.SQRT1_2;
    moveY *= Math.SQRT1_2;
  }
  this.x += moveX;
  this.y += moveY;
  this.centerX += moveX;
  this.centerY += moveY;
};

function Enemy(isBoss) {
  var ctx = context;
  var gs = gameState;
  var gc = gameCanvas;
  this.isBoss = isBoss;
  this.rightLim = gc.width;
  this.bottomLim = gc.height;
  
  this.active = true;
  this.dying = false;
  this.age = 0;
  this.difficulty = gs.gameAge < 30000 ? Math.ceil(gs.gameAge / 1200) - 1 : 24;
  
  if (this.isBoss !== true) {
    this.firing = true;
    this.model = Math.ceil(Math.random() * 12);
    switch (this.model) {
    case 1:
      this.img = gs.enemyImgB;
      this.maxHealth = 8;
      this.maxAge = 30;
      this.speed = 1;
      this.name = "circle";
      break;
    case 2:
      this.img = gs.enemyImgC;
      this.maxHealth = 6;
      this.maxAge = 15;
      this.speed = 2;
      this.name = "aim";
      break;
    default:
      this.img = gs.enemyImg;
      this.maxHealth = 4;
      this.maxAge = 20;
      this.speed = 4;
      this.name = "rando";
      break;
    }
    this.x = Math.random() * (gc.width - this.img.width);
    this.y = -this.img.height;
    this.angle = -30 + Math.random() * 60;
    this.xVelocity = this.speed * Math.sin(this.angle * Math.PI / 180);
    this.yVelocity = this.speed * Math.cos(this.angle * Math.PI / 180);
  } else {
    randomSynth.pause();
    this.firing = false;
    this.img = gs.bossImg;
    this.maxHealth = 180 + gs.gameAge * 0.025;
    this.maxAge = 4;
    this.x = 0.5 * gc.width - 0.5 * this.img.width;
    this.y = -100;
    this.xVelocity = 0;
    this.yVelocity = 2;
    this.name = "boss";
    this.spin = (Math.random() < 0.5) ? -1 : 1;
    this.pattern = (Math.random() < 0.5) ? "flower" : "cannon";
    this.berserk = false;
    this.chargeTime = 0;
  }
  this.width = this.img.width;
  this.height = this.img.height;
  this.health = this.maxHealth;
}
Enemy.prototype.inBounds = function () {
  return (this.x >= -this.width && this.x <= this.rightLim &&
          this.y >= -this.height && this.y <= this.bottomLim);
};
Enemy.prototype.draw = function () {
  var gs = gameState;
  if (!this.dying) {
    context.drawImage(this.img, this.x, this.y);
  } else {
    context.drawImage(this.img, this.x + this.width * this.deathAge * 0.125, this.y + this.height * this.deathAge * 0.125,
                  this.width * (4 - this.deathAge) * 0.25, this.height * (4 - this.deathAge) * 0.25);
    this.deathAge += 1;
    if (this.deathAge >= 4) {
      this.active = false;
      if (this.isBoss) {
        gs.fightingBoss = false;
        gs.enemyBullets.forEach(function (bullet) {
          bullet.active = false;
        });
      }
    }
  }
};
Enemy.prototype.shoot = function () {
  var gs = gameState;
  var pl = player;
  var i;
  var bulletPositionX = this.x + 0.5 * this.width - 5;
  var bulletPositionY = this.y + this.height;
  switch (this.name) {
  case "rando":
    var baseAngle = -60 + Math.random() * 115;
    gs.enemyBullets.push(new Bullet(8 + this.difficulty, bulletPositionX, bulletPositionY, baseAngle));
    gs.enemyBullets.push(new Bullet(8 + this.difficulty, bulletPositionX, bulletPositionY, baseAngle + 5));
    break;
  case "circle":
    for (i = 0; i < 360; i += 30) {
      gs.enemyBullets.push(new Bullet(4 + this.difficulty, bulletPositionX, bulletPositionY - 0.5 * this.height, i));
    }
    break;
  case "aim":
    var dx = pl.centerX - 1 - bulletPositionX;
    var dy = pl.centerY - 1 - bulletPositionY;
    gs.enemyBullets.push(new Bullet(10 + this.difficulty, bulletPositionX, bulletPositionY, -(Math.atan2(dy, dx) * 180 / Math.PI - 90)));
    break;
  case "boss":
    if (this.age % 360 === 0) {
      if (!this.berserk) {
        this.berserk = (Math.random() < 0.5) ? true : false;
        this.chargeFull = this.pattern === "flower" ? 20 : 10;
      }
      this.spin = (Math.random() < 0.5) ? this.spin : -this.spin;
      this.pattern = (Math.random() < 0.5) ? "flower" : "cannon";
    }
    if (this.berserk) {
      this.chargeTime += 1;
      if (this.chargeTime === this.chargeFull + 10) {
        this.berserk = false;
        this.chargeTime = 0;
      } else if (this.chargeTime >= this.chargeFull) {
        for (i = 0; i < 400; i += 10) {
          gs.enemyBullets.push(new Bullet(12 + this.difficulty - (this.chargeTime - this.chargeFull), this.x + i, bulletPositionY, 0));
        }
      }
    } else if (this.pattern === "flower") {
      var startCenterY = bulletPositionY - 0.5 * this.height - 5;
      for (i = 0; i < 360; i += 30) {
        gs.enemyBullets.push(new Bullet(3 + this.difficulty, bulletPositionX,
                                     startCenterY, this.spin * ((2 * this.age) % 360) - i));
      }
      for (i = 0; i < 360; i += 30) {
        gs.enemyBullets.push(new Bullet(3 + this.difficulty, bulletPositionX,
                                     startCenterY, -this.spin * ((3 * this.age) % 360) - i));
      }
    } else if (this.pattern === "cannon") {
      var tempAngle = this.spin * (4.25 * this.age % 120 - 60);
      for (i = 110; i <= 130; i += 20) {
        gs.enemyBullets.push(new Bullet(5 + this.difficulty, this.x + i, bulletPositionY, tempAngle));
      }
      for (i = 260; i <= 280; i += 20) {
        gs.enemyBullets.push(new Bullet(5 + this.difficulty, this.x + i, bulletPositionY, -tempAngle));
      }
    }
    if ((this.age % 52 === 0) || ((this.age - 4) % 52 === 0) || ((this.age - 8) % 52 === 0)) {
      var dx1 = pl.centerX - 1 - (this.x + 50);
      var dx2 = pl.centerX - 1 - (this.x + this.width - 50);
      var dys = pl.centerY - 1 - (this.y + this.height);
      gs.enemyBullets.push(new Bullet(8 + this.difficulty, this.x + 45, bulletPositionY,
                                      (Math.atan2(dx1, dys) * 180 / Math.PI)));
      gs.enemyBullets.push(new Bullet(8 + this.difficulty, this.x + this.width - 55, bulletPositionY,
                                      (Math.atan2(dx2, dys) * 180 / Math.PI)));
    }
    break;
  }
};
Enemy.prototype.update = function () {
  if (this.age === 100 && this.name === "aim" && !this.dying) {
    this.xVelocity = (Math.abs(this.xVelocity) / this.xVelocity) * this.speed;
    this.yVelocity = 0;
  }
  if (this.age === 52 && this.isBoss) {
    bossSynth.play();
    this.yVelocity = 0;
    this.firing = true;
  }
  this.x += this.xVelocity;
  this.y += this.yVelocity;

  this.active = this.active && this.inBounds();
  if (!this.dying && this.age % this.maxAge === 0 && this.firing) {
    this.shoot();
  }
  this.age += 1;
};
Enemy.prototype.explode = function () {
  if (!this.dying) {
    flock.synth(explodeSynthObj);
    this.dying = true;
    this.deathAge = -2;
    if (this.isBoss) {
      bossSynth.pause();
      randomSynth.play();
    }
  }
};

gameState.handleCollisions = function () {
  var i, j;
  var pbLen = this.playerBullets.length;
  var eLen = this.enemies.length;
  var ebLen = this.enemyBullets.length;
  for (i = 0; i < pbLen; i += 1) {
    for (j = 0; j < eLen; j += 1) {
      if (this.collides(this.playerBullets[i], this.enemies[j])) {
        this.enemies[j].health -= 1;
        this.playerBullets[i].active = false;
        if (this.enemies[j].health < 1) {
          player.score += this.enemies[j].maxHealth;
          this.enemies[j].explode();
        }
      }
    }
  }
  for (i = 0; i < ebLen; i += 1) {
    if (this.circleCollides(this.enemyBullets[i], player)) {
      player.health -= 1;
      this.enemyBullets[i].active = false;
      if (player.health < 1) {
        player.explode();
      }
    }
  }
  for (i = 0; i < eLen; i += 1) {
    if (this.hitboxCollides(this.enemies[i], player)) {
      if (!this.enemies[i].isBoss) {
        this.enemies[i].explode();
      }
      player.health -= 1;
      if (player.health < 1) {
        player.explode();
      }
    }
  }
};

// All of the tutorials on the internet recommend recycling bullets to avoid garbage collection, but making new bullets from a constructor and replacing the old array of active bullets every loop is much faster than using splice to move bullets between arrays.
gameState.drawAndUpdate = function (list) {
  this.tempList = [];
  var i;
  var len = list.length;
  for (i = 0; i < len; i += 1) {
    list[i].update();
    if (list[i].active) {
      this.tempList.push(list[i]);
    }
    list[i].draw();
  }
  return this.tempList;
};

function runMain() {
  var gs = gameState;
  var gc = gameCanvas;
  var pl = player;
  var ctx = context;
  gs.loop = window.setTimeout(runMain, 25);
  ctx.clearRect(0, 0, gc.width, gc.height);
  pl.movePlayer();
  ctx.drawImage(gs.playerImg, pl.x, pl.y);
  
  gs.playerBullets = gs.drawAndUpdate(gs.playerBullets);
  gs.enemies = gs.drawAndUpdate(gs.enemies);
  if (!gs.fightingBoss) {
    if (gs.gameAge % 1200 === 0) {
      gs.enemies.forEach(function (enemy) {
        enemy.explode();
      });
      gs.fightingBoss = true;
      gs.enemies.push(new Enemy(true));
    } else if ((gs.gameAge % 4 === 0) && (Math.random() < (0.13 + pl.score * 0.0001)) && (!gs.fightingBoss)) {
      gs.enemies.push(new Enemy(false));
    }
    gs.gameAge += 1;
  }
  gs.enemyBullets = gs.drawAndUpdate(gs.enemyBullets);
  gs.handleCollisions();

  ctx.fillText("Score: " + pl.score, 5, 5);
  if (gs.fightingBoss) {
    ctx.fillRect(100, 10, (gs.enemies[0].health / gs.enemies[0].maxHealth) * (gc.width - 200), 5);
  }
  if (!gs.playing) {
    ctx.fillText(gameOver, 0.5 * gc.width - 0.5 * gameOverWidth, 0.5 * gc.height);
    window.clearTimeout(gs.loop);
    if (pl.score >= 210) {
      document.getElementById("bossdied").style.display = "block";
    }
    randomSynth.pause();
    enviro.stop();
    cleanUp();
  }
}

function fire() {
  player.getBullet();
  gameState.fireLoop = window.setTimeout(fire, 211);
}

function click(e) {
  var gs = gameState;
  if (gs.started) {
    if (!gs.firing) {
      gs.firing = true;
      fire();
    } else {
      gs.firing = false;
      window.clearTimeout(gs.fireLoop);
      gs.fireLoop = null;
    }
  } else if (!gs.started) {
    randomSynth.play();
    gs.playing = true;
    gs.started = true;
    player.score = 0;
    player.width = gs.playerImg.width;
    player.height = gs.playerImg.height;
    player.radius = 1;
    setPlayerRect(e);
    context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    context.drawImage(gs.playerImg, player.x, player.y);
    gameCanvas.addEventListener("mousemove", setPlayerRect);
    runMain();
    if (player.x === player.centerX) {
      gs.playing = false;
    }
  }
}

function kbdDown(e) {
  if ([0x25, 0x26, 0x27, 0x28].indexOf(e.keyCode) > -1) {
    e.preventDefault();
  }
  switch (e.keyCode) {
  case 0x25:
    player.movingLeft = true;
    break;
  case 0x26:
    player.movingUp = true;
    break;
  case 0x27:
    player.movingRight = true;
    break;
  case 0x28:
    player.movingDown = true;
    break;
  }
}

function kbdUp(e) {
  switch (e.keyCode) {
  case 0x5A:
    if (!gameState.firing) {
      player.getBullet();
    }
    break;
  case 0x25:
    player.movingLeft = false;
    break;
  case 0x26:
    player.movingUp = false;
    break;
  case 0x27:
    player.movingRight = false;
    break;
  case 0x28:
    player.movingDown = false;
    break;
  case 0x58:
    player.fast = !player.fast;
    break;
  }
}

function getBoss() {
  var bossNum = document.getElementById("textbox").value;
  gameState.gameAge = bossNum > 0 ? Math.ceil(bossNum) * 1200 : 1200;
  if (gameState.gameAge > 30000) {
    gameState.gameAge = 30000;
  }
  var bossMessage = "BOSS READY - CLICK TO BEGIN!";
  var bossMessageWidth = context.measureText(bossMessage).width;
  player.score = 0;
  if (!gameState.started) {
    context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    context.fillText(bossMessage, 0.5 * gameCanvas.width - 0.5 * bossMessageWidth, 0.5 * gameCanvas.height);
  }
}

function cleanUp() {
  window.clearTimeout(gameState.fireLoop);
  gameCanvas.removeEventListener("mousemove", setPlayerRect);
  gameCanvas.removeEventListener("click", click);
  window.removeEventListener("keyup", kbdUp);
  window.removeEventListener("keydown", kbdDown);
  gameState = undefined;
  player = undefined;
}

gameCanvas.addEventListener("click", click);
window.addEventListener("keyup", kbdUp);
window.addEventListener("keydown", kbdDown);
