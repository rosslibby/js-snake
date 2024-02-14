const MS = 125
const INITIAL_DIRECTION = 'up'
const COLUMNS = 25
const ROWS = 35
const CELLS = COLUMNS * ROWS
const INITIAL_PLAYER = [
  (Math.floor(ROWS / 2) * COLUMNS - Math.ceil(COLUMNS / 2)) - COLUMNS,   // head
  Math.floor(ROWS / 2) * COLUMNS - Math.ceil(COLUMNS / 2),   // midpoint
  (Math.floor(ROWS / 2) * COLUMNS - Math.ceil(COLUMNS / 2)) + COLUMNS,   // tail
]
// const INITIAL_PLAYER = [Math.floor(CELLS / 2) - COLUMNS, Math.floor(CELLS / 2), Math.floor(CELLS / 2) + COLUMNS]
const config = {
  leftWall: true,
  rightWall: true,
  topWall: true,
  bottomWall: true,
}
let paused = false
const player = []
let lost = false
const keystrokes = []
let timer = null
let running = false
let last = player[player.length - 1]
let score = 0
let piece = 0
const grid = Array(CELLS).fill(0)
let direction = INITIAL_DIRECTION

const placePiece = () => {
  const random = Math.floor((Math.random() * CELLS))
  if (player.includes(random)) {
    return placePiece()
  } else {
    piece = random
  }
}

const draw = () => {
  const container = document.getElementById('game')
  if (running) {
    Array.from(container.querySelectorAll('.cell')).forEach(cell => {
      const id = Number(cell.id)

      if (player.includes(id) && !cell.classList.contains('player')) {
        cell.classList.add('player')
      } else if (!player.includes(id) && cell.classList.contains('player')) {
        cell.classList.remove('player')
      } else if (id === piece && !cell.classList.contains('piece')) {
        cell.classList.add('piece')
      } else if (id !== piece && cell.classList.contains('piece')) {
        cell.classList.remove('piece')
      }
    })
  } else {
    container.innerHTML = ''
    grid.forEach((item, idx) => {
      const el = document.createElement('div')
      el.id = idx
      el.classList.add('cell')
      if (player.includes(idx)) {
        el.classList.add('player')
      } else if (idx === piece) {
        el.classList.add('piece')
      }
      container.appendChild(el)
    })
  }
}

const moveUp = () => {
  const head = player[0]
  const move = () => {
    last = player.pop()
    const nextPos = head - COLUMNS

    collisions(nextPos)
    if (player.includes(nextPos)) {
      endGame()
    } else {
      player.unshift(nextPos)
    }
  }

  if (config.topWall) {
    if (head > COLUMNS - 1) {
      move()
    } else {
      endGame()
    }
  } else {
    move()
  }
}

const moveDown = () => {
  const head = player[0]
  const move = () => {
    last = player.pop()
    const nextPos = head + COLUMNS

    collisions(nextPos)
    if (player.includes(nextPos)) {
      endGame()
    } else {
      player.unshift(nextPos)
    }
  }

  if (config.bottomWall) {
    if (head < CELLS - COLUMNS) {
      move()
    } else {
      endGame()
    }
  } else {
    move()
  }
}

const moveLeft = () => {
  const head = player[0]
  const move = () => {
    last = player.pop()
    const nextPos = head - 1

    collisions(nextPos)
    if (player.includes(nextPos)) {
      endGame()
    } else {
      player.unshift(nextPos)
    }
  }
  if (config.leftWall) {
    if (head % COLUMNS > 0) {
      move()
    } else {
      endGame()
    }
  } else {
    move()
  }
}

const moveRight = () => {
  const head = player[0]
  const move = () => {
    last = player.pop()
    const nextPos = head + 1

    collisions(nextPos)
    if (player.includes(nextPos)) {
      endGame()
    } else {
      player.unshift(nextPos)
    }
  }
  if (config.rightWall) {
    if (head % COLUMNS < COLUMNS - 1) {
      move()
    } else {
      endGame()
    }
  } else {
    move()
  }
}

const directions = {
  left: () => moveLeft(),
  right: () => moveRight(),
  up: () => moveUp(),
  down: () => moveDown(),
}

document.addEventListener('keydown', e => {
  if (!running) {
    console.log(e.key)
    if (paused && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) {
      startGame()
    }

    return
  }

  if (e.key === 'Escape') {
    pauseGame()
  }

  const keyDir = e.key.substring(5).toLowerCase()

  if (
    (['up', 'down'].includes(keyDir) && !['up', 'down'].includes(direction))
    || (['left', 'right'].includes(keyDir) && !['left', 'right'].includes(direction))
  ) {
    if (!running) {
      startGame()
    }

    const keystrokeMs = (new Date()).getTime()
    const lastKeystrokeMs = keystrokes.pop()
    keystrokes.push(keystrokeMs)

    if (lastKeystrokeMs) {
      if (keystrokeMs - lastKeystrokeMs < MS) {
        setTimeout(() => {
          direction = keyDir
        }, MS - (keystrokeMs - lastKeystrokeMs))
      } else {
        direction = keyDir
      }
    } else {
      direction = keyDir
    }
  }
})

function collisions(head) {
  if (
    (direction === 'up' && head < 0)
    || (direction === 'down' && head > CELLS - 1)
    || (direction === 'left' && head % COLUMNS < 0)
    || (direction === 'right' && head % COLUMNS === COLUMNS)
  ) {
    endGame()
  } else if (head === piece) {
    player.push(last)
    score += 10
    document.getElementById('score').innerText = score
    placePiece()
  }
}

const move = () => {
  directions[direction]()
}

function pauseGame() {
  paused = true
  document.getElementById('overlay').classList.toggle('overlay--hidden')
  document.getElementById('pause-button').innerText = 'Resume game'
  running = false
  clearInterval(timer)
}

function startGame() {
  running = true

  document.getElementById('pause-button').classList.remove('hidden')
  document.getElementById('pause-button').innerText = 'Pause game'
  document.getElementById('start-button').classList.add('hidden')
  document.getElementById('overlay').classList.toggle('overlay--hidden')

  timer = setInterval(() => {
    move()
    draw()
  }, MS)
}

function endGame() {
  document.getElementById('pause-button').classList.add('hidden')
  document.getElementById('start-button').classList.remove('hidden')
  document.getElementById('overlay').classList.toggle('overlay--hidden')

  lost = true
  running = false
  clearInterval(timer)
  console.log('game over')
  document.getElementById('start-button').innerText = 'Play again'
}

const setupGrid = (rows = ROWS, columns = COLUMNS) => {
  const r = document.querySelector(':root')
  r.style.setProperty('--columns', columns)
  r.style.setProperty('--rows', rows)
}

function init() {
  setupGrid()
  while(player.length) {
    player.pop()
  }
  INITIAL_PLAYER.forEach(item => player.push(item))
  grid.fill(0)
  direction = INITIAL_DIRECTION
  placePiece()
  draw()

  startGame()
}

document.getElementById('start-button').onclick = () => init()
document.getElementById('pause-button').onclick = (e) => {
  if (running) {
    pauseGame()
  } else {
    startGame()
  }
}
