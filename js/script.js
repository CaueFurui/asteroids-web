const FPS = 30 // frames per second
const shipSize = 30 // height of the ship (in pixels)
const laserMax = 10 // max. number of lasers on screen at once
const laserSpeed = 500 // speed of lasers in pixels per second
const laserDistance = 0.6 // max distance laser can travel as fraction of screen width 
const laserExplodeDur = 0.1 // duration of the laser explosion
const friction = 0.7 // friction coefficient of space (0 = no-friction, 1 = must-friction)
const gameLives = 3 // starting numbers of lives
const shipThrust = 5 // acceleration of the (ship pixels per second)
const shipExplodeDur = 0.3 // duration of the ship explosion
const saveKeyScore = '@score/high' // key of highScore
const shipBlinkDur = 0.1 // duration of the ship blink during invisibility in seconds
const shipInvDur = 0.3 // duration of the ship invisibility in seconds
const turnSpeed = 360 // turn speed in degrees per second
const roidsPtsLg = 20 // starting number of the asteroids
const roidsPtsMd = 50 // starting number of the asteroids
const roidsPtsSm = 100 // starting number of the asteroids
const roidsNum = 1 // starting number of the asteroids
const roidsJag = 0.4 // jaggedness of the asteroids (0 = none, 1 = lots)
const roidSpd = 50 // max starting speed of asteroids in pixels per second
const roidSize = 100 // asteroid size in pixels
const roidsVert = 10 // average number of vertices in the asteroid
const showBounding = false // show or hide collision detection
const showCentreDot = false // show or hide ship's centre dot
const textFadeTime = 2.5 // text fade time in seconds
const textSize = 40 // text font size in pixels

/** @type {HTMLCanvasElement}  */

var canv = document.getElementById("gameCanvas")
var ctx = canv.getContext("2d")

// set up game parameters
var level, roids, lives, ship, text, score, highScore, textAlpha
newGame()

// event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// game loop
setInterval(update, 1000 / FPS)

function createAsteroidsBelt() {
  roids = []
  var x, y
  for(var i = 0; i < roidsNum + level; i++) {
    do {
      x = Math.floor(Math.random() * canv.width)
      y = Math.floor(Math.random() * canv.height)
    } while (distBetweenPoints(ship.x, ship.y, x, y) < roidSize * 2 + ship.r)
    roids.push(newAsteroid(x, y, Math.ceil(roidSize / 2)))
  }
}

function destroyAsteroid(index) {
  var x = roids[index].x;
  var y = roids[index].y;
  var r = roids[index].r;

  // split the asteroid in two if necessary
  if (r == Math.ceil(roidSize / 2)) { // large asteroid
      roids.push(newAsteroid(x, y, Math.ceil(roidSize / 4)));
      roids.push(newAsteroid(x, y, Math.ceil(roidSize / 4)));
      score += roidsPtsLg
  } else if (r == Math.ceil(roidSize / 4)) { // medium asteroid
      roids.push(newAsteroid(x, y, Math.ceil(roidSize / 8)));
      roids.push(newAsteroid(x, y, Math.ceil(roidSize / 8)));
      score += roidsPtsMd
  } else {
    score += roidsPtsSm
  }

  // check highScore
  if(score > highScore) {
    highScore = score
    localStorage.setItem(saveKeyScore, highScore)
  }

  // destroy the asteroid
  roids.splice(index, 1);

  // new level when no more asteroids
  if (roids.length === 0) {
    level++
    newLevel()
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

function drawShip(x, y, a, color = 'white') {
  ctx.strokeStyle = color
  ctx.lineWidth = shipSize / 20
  ctx.beginPath();
  ctx.moveTo( // nose of the ship
    x + 4 / 3 * ship.r * Math.cos(a),
    y - 4 / 3 * ship.r * Math.sin(a)
  )
  ctx.lineTo( // rear left of the ship
    x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
    y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
  )
  ctx.lineTo( // rear right of the ship
    x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
    y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
  )
  ctx.closePath()
  ctx.stroke()
}

function explodeShip() {
  ship.explodeTime = Math.ceil(shipExplodeDur * FPS)
}

function gameOver() {
  ship.dead = true
  text = 'Game Over'
  textAlpha = 1.0
}

function keyDown(/** @type {KeyboardEvent} */ ev) {

  if(ship.dead) {
    return
  }

  switch(ev.code) {
    case 'Space': // space bar (shoot laser)
      shootLaser()
      break;
    case 'ArrowLeft': // left arrow (rotate to the left)
      ship.rot = turnSpeed / 180 * Math.PI / FPS;
      break;
    case 'ArrowUp': // up arrow (go forward) 
      ship.thrusting = true
      break;
    case 'ArrowRight': // right arrow (rotate to the right)
      ship.rot = -turnSpeed / 180 * Math.PI / FPS;
      break;
  }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {

  if(ship.dead) {
    return
  }

  switch(ev.code) {
    case 'Space': // space bar (allow shooting again)
      ship.canShoot = true
      break;
    case 'ArrowLeft': // left arrow (stop rotating to the left)
      ship.rot = 0;
      break;
    case 'ArrowUp': // up arrow (stop forward) 
      ship.thrusting = false
      break;
    case 'ArrowRight': // right arrow (stop rotating to the right)
      ship.rot = 0;
      break;
  }
}

function newGame() {
  score = 0
  level = 0
  lives = gameLives
  ship = newShip()

  // get the high score from the storage
  scoreStrg = localStorage.getItem(saveKeyScore)
  if (scoreStrg === null) {
    highScore = 0
  } else {
    highScore = parseInt(scoreStrg)
  }

  newLevel()
}

function newLevel() {
  text = 'Level ' + (level + 1)
  textAlpha = 1.0
  createAsteroidsBelt()
}

function newAsteroid(x, y, r) {
  var lvlMul = 1 + 0.1 * level
  var roid = {
    x,
    y,
    r,
    xv: Math.random() * roidSpd * lvlMul / FPS * (Math.random() < 0.5 ? 1 : -1),
    yv: Math.random() * roidSpd * lvlMul / FPS * (Math.random() < 0.5 ? 1 : -1),
    a: Math.random() * Math.PI * 2, // in radians
    vert: Math.floor(Math.random() * (roidsVert + 1) + roidsVert / 2),
    offs: []
  }

  // create the vertex offset offs array
  for (var i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * roidsJag * 2 + 1 - roidsJag)
  }

  return roid
}

function newShip() {
  return {
    x: canv.width / 2, // position in width of the ship
    y: canv.height / 2, // position in height of the ship
    r: shipSize / 2, // radius of the ship
    a: 90 / 180 * Math.PI, //convert to radians,
    blinkTime: Math.ceil(shipBlinkDur / shipInvDur),
    blinkNum: Math.ceil(shipInvDur * FPS),
    explodeTime: 0,
    rot: 0,
    canShoot: true,
    lasers: [],
    thrusting: false,
    thrust: {
      x: 0,
      y: 0
    },
    dead: false
  }
}

function shootLaser() {
  // create the laser object
  if (ship.canShoot && ship.lasers.length < laserMax) {
    ship.lasers.push({ // from the nose of the ship
      x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
      y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
      xv: laserSpeed * Math.cos(ship.a) / FPS,
      yv: -laserSpeed * Math.sin(ship.a) / FPS,
      dist: 0,
      explodeTime: 0
    })
  }

  // prevent further shooting
  ship.canShoot = false
}

function update() {
  var blinkOn = ship.blinkNum % 2 === 0
  var exploding = ship.explodeTime > 0;

  // draw space
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canv.width, canv.height)

  // thrust the ship
  if(ship.thrusting && !ship.dead) {
    ship.thrust.x += shipThrust * (Math.cos(ship.a) / FPS)
    ship.thrust.y -= shipThrust * (Math.sin(ship.a) / FPS)

    // draw thrusting
    if (!exploding && blinkOn) {
      ctx.fillStyle = "red"
      ctx.strokeStyle = "yellow"
      ctx.lineWidth = shipSize / 10
      ctx.beginPath();
      ctx.moveTo( // rear left
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
      )
      ctx.lineTo( // rear center behind the ship
        ship.x - ship.r * 5 / 3 * Math.cos(ship.a),
        ship.y + ship.r * 5 / 3 * Math.sin(ship.a)
      )
      ctx.lineTo( // rear right
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 *  Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 *  Math.cos(ship.a))
      )
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

  } else {
    ship.thrust.x -= friction * ship.thrust.x / FPS
    ship.thrust.y -= friction * ship.thrust.y / FPS
  }

  // draw triangular ship
  if(!exploding) {
    if (blinkOn && !ship.dead) {
      drawShip(ship.x, ship.y, ship.a)
    }
    // handle blinking
    if (ship.blinkNum > 0) {
      // reduce the blink time
      ship.blinkTime--

      //reduce the blink num
      if (ship.blinkTime === 0) {
        ship.blinkTime = Math.ceil(shipBlinkDur * FPS)
        ship.blinkNum--
      }
    }
  } else {
    // draw the explosion
    ctx.fillStyle = 'darkred'
    ctx.beginPath()
    ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false)
    ctx.fill()
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false)
    ctx.fill()
    ctx.fillStyle = 'orange'
    ctx.beginPath()
    ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false)
    ctx.fill()
    ctx.fillStyle = 'yellow'
    ctx.beginPath()
    ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false)
    ctx.fill()
  }

  if(showBounding) {
    ctx.strokeStyle = 'lime'
    ctx.beginPath()
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false)
    ctx.stroke()
  }

  // draw the asteroids
  var x, y, r, a, vert, offs
  for (var i = 0; i < roids.length; i++) {
    ctx.strokeStyle = "slategrey"
    ctx.lineWidth = shipSize / 20
    
    // get the asteroid properties
     x = roids[i].x
     y = roids[i].y
     r = roids[i].r
     a = roids[i].a
     vert = roids[i].vert
     offs = roids[i].offs

    // draw a path
    ctx.beginPath()
    ctx.moveTo(
      x + r * offs[0] * Math.cos(a),
      y + r * offs[0] * Math.sin(a)
    )

    // draw the polygon
    for (var j = 1; j < vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
        y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
      )
    }
    ctx.closePath()
    ctx.stroke()

    if(showBounding) {
      ctx.strokeStyle = 'lime'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.stroke()
    }
  }

  // center dot
  if (showCentreDot) {
    ctx.fillStyle = "red"
    ctx.fillRect(ship.x - 1, ship.y - 1 , 2, 2)
  }

  // draw the lasers
  for (var i = 0; i < ship.lasers.length; i++) {
    if(ship.lasers[i].explodeTime === 0) {
      ctx.fillStyle = 'salmon'
      ctx.beginPath()
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, shipSize / 15, 0, Math.PI * 2, false)
      ctx.fill()
    } else {
      // draw the explosion
      ctx.fillStyle = 'orangered'
      ctx.beginPath()
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false)
      ctx.fill()
      ctx.fillStyle = 'salmon'
      ctx.beginPath()
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false)
      ctx.fill()
      ctx.fillStyle = 'pink'
      ctx.beginPath()
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false)
      ctx.fill()
    }
  }

  // draw the game text
  if (textAlpha >= 0) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255, 255, 255, ' + textAlpha + ')'
    ctx.font = 'small-caps ' + textSize + 'px dejavu sans mono'
    ctx.fillText(text, canv.width / 2, canv.height * 0.75)
    textAlpha -= (1.0 / textFadeTime / FPS)
  } else if (ship.dead) {
    newGame()
  }

  // draw the lives
  var lifeColor
  for (var i = 0; i < lives; i++) {
    lifeColor = exploding && i === lives - 1 ? 'red' : 'white'
    drawShip(shipSize + i * shipSize * 1.2, shipSize, 0.5 * Math.PI, lifeColor)
  }

  // draw the score
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'white'
  ctx.font = textSize + 'px dejavu sans mono'
  ctx.fillText(score, canv.width - shipSize / 2, shipSize)

    // draw the high score
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'white'
    ctx.font = textSize * 0.75 + 'px dejavu sans mono'
    ctx.fillText('HIGH SCORE ' + highScore, canv.width / 2, shipSize)


  // detects laser hits on asteroids
  var ax, ay, ar, lx, ly
  for (var i = roids.length - 1; i >= 0; i--) {
    
    // grab de asteroid properties
    ax = roids[i].x
    ay = roids[i].y
    ar = roids[i].r

    // loop over the lasers
    for (var j = ship.lasers.length - 1; j >= 0; j--) {
      // grab lasers properties
      lx = ship.lasers[j].x
      ly = ship.lasers[j].y

      // detect hits
      if (ship.lasers[j].explodeTime === 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {
        // destroy asteroid and activate laser explosion
        destroyAsteroid(i)
        ship.lasers[j].explodeTime = Math.ceil(laserExplodeDur * FPS);
        break
      }
    }
  }

  if (!exploding) {
    if (ship.blinkNum === 0 && !ship.dead) {
      // check for asteroid collision
      for (var i = 0; i < roids.length; i++) {
        if (distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r) {
          explodeShip()
          destroyAsteroid(i)
          break
        }
      }
    }
  
    // rotate ship
    ship.a += ship.rot
  
    // move the ship
    ship.x += ship.thrust.x
    ship.y += ship.thrust.y
  } else {
    ship.explodeTime--

    if (ship.explodeTime === 0) {
      lives--
      if (lives === 0){
        gameOver()
      } else {
        ship = newShip()
      }
    }
  }

  // handle edge of the screen
  if (ship.x < 0 - ship.r) {
    ship.x = canv.width + ship.r
  } else if (ship.x > canv.width + ship.r) {
    ship.x = 0 - ship.r
  }
  if (ship.y < 0 - ship.r) {
    ship.y = canv.height + ship.r
  } else if (ship.y > canv.height + ship.r) {
    ship.y = 0 - ship.r
  }

  // move the lasers
  for (var i = ship.lasers.length - 1; i >= 0; i--) {    
    // check distance traveled
    if (ship.lasers[i].dist > laserDistance * canv.width) {
      ship.lasers.splice(i, 1)
      continue;
    }

    // handle the explosion
    if (ship.lasers[i].explodeTime > 0) {
      ship.lasers[i].explodeTime--

      // destroy laser after the duration is over
      if (ship.lasers[i].explodeTime === 0) {
        ship.lasers.splice(i, 1)
        continue
      }
    } else {
      // move the laser
      ship.lasers[i].x += ship.lasers[i].xv
      ship.lasers[i].y += ship.lasers[i].yv
  
      // calculate the distance traveled
      ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2))
    }


    if (ship.lasers[i].x < 0) {
      ship.lasers[i].x = canv.width
    } else if (ship.lasers[i].x > canv.width) {
      ship.lasers[i].x = 0
    }
    if (ship.lasers[i].y < 0) {
      ship.lasers[i].y = canv.width
    } else if (ship.lasers[i].y > canv.width) {
      ship.lasers[i].y = 0
    }
  }

  // move the asteroid
  for (var i = 0; i < roids.length; i++) {
    roids[i].x += roids[i].xv
    roids[i].y += roids[i].yv

    // handle edge of the screen
    if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = canv.width + roids[i].r
    } else if (roids[i].x > canv.width + roids[i].r) {
      roids[i].x = 0 - roids[i].r
    }
    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = canv.height + roids[i].r
    } else if (roids[i].y > canv.height + roids[i].r) {
      roids[i].y = 0 - roids[i].r
    }
  }
}