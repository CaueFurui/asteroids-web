const FPS = 30 // frames per second
const shipSize = 30 // height of the ship (in pixels)
const friction = 0.7 // friction coefficient of space (0 = no-friction, 1 = must-friction)
const shipThrust = 5 // acceleration of the (ship pixels per second)
const turnSpeed = 360 // turn speed in degrees per second
const roidsNum = 3 // starting number of the asteroids
const roidsJag = 0.4 // jaggedness of the asteroids (0 = none, 1 = lots)
const roidSpd = 50 // max starting speed of asteroids in pixels per second
const roidSize = 100 // asteroid size in pixels
const roidsVert = 10 // average number of vertices in the asteroid

/** @type {HTMLCanvasElement}  */

var canv = document.getElementById("gameCanvas")
var ctx = canv.getContext("2d")

// set up ship
var ship = {
  x: canv.width / 2, // position in width of the ship
  y: canv.height / 2, // position in height of the ship
  r: shipSize / 2, // radius of the ship
  a: 90 / 180 * Math.PI, //convert to radians,
  rot: 0,
  thrusting: false,
  thrust: {
    x: 0,
    y: 0
  }
}

// set up asteroids
var roids = []
createAsteroidsBelt()

// event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// game loop
setInterval(update, 1000 / FPS)

function createAsteroidsBelt() {
  roids = []
  var x, y
  for(var i = 0; i < roidsNum; i++) {
    do {
      x = Math.floor(Math.random() * canv.width)
      y = Math.floor(Math.random() * canv.height)
    } while (distBetweenPoints(ship.x, ship.y, x, y) < roidSize * 2 + ship.r)
    
    roids.push(newAsteroid(x, y))
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

function newAsteroid(x, y) {
  var roid = {
    x,
    y,
    xv: Math.random() * roidSpd / FPS * (Math.random() < 0.5 ? 1 : -1),
    yv: Math.random() * roidSpd / FPS * (Math.random() < 0.5 ? 1 : -1),
    r: roidSize / 2,
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

function keyDown(/** @type {KeyboardEvent} */ ev) {
  switch(ev.code) {
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
  switch(ev.code) {
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

function update() {
  // draw space
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canv.width, canv.height)

  // draw triangular ship
  ctx.strokeStyle = "white"
  ctx.lineWidth = shipSize / 20
  ctx.beginPath();
  ctx.moveTo( // nose of the ship
    ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
    ship.y - 4 / 3 * ship.r * Math.sin(ship.a)
  )
  ctx.lineTo( // rear left of the ship
    ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a))
  )
  ctx.lineTo( // rear right of the ship
    ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))
  )
  ctx.closePath()
  ctx.stroke()

  // rotate ship
  ship.a += ship.rot

  // draw the asteroids
  ctx.strokeStyle = "slategrey"
  ctx.lineWidth = shipSize / 20
  var x, y, r, a, vert, offs
  for (var i = 0; i < roids.length; i++) {
    
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

    // move the asteroid
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

  // thrust the ship
  if(ship.thrusting) {
    ship.thrust.x += shipThrust * (Math.cos(ship.a) / FPS)
    ship.thrust.y -= shipThrust * (Math.sin(ship.a) / FPS)

    // draw thrusting
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

  } else {
    ship.thrust.x -= friction * ship.thrust.x / FPS
    ship.thrust.y -= friction * ship.thrust.y / FPS
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

  // move the ship
  ship.x += ship.thrust.x
  ship.y += ship.thrust.y


  // center dot
  // ctx.fillStyle = "red"
  // ctx.fillRect(ship.x - 1, ship.y - 1 , 2, 2)
}