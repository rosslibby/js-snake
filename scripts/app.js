const MS = 125
const INITIAL_DIRECTION = 'up'
const COLUMNS = 35
const ROWS = 35
const CELLS = COLUMNS * ROWS
const INITIAL_PLAYER = [
  (Math.floor(ROWS / 2) * COLUMNS - Math.ceil(COLUMNS / 2)) - COLUMNS,   // head
  Math.floor(ROWS / 2) * COLUMNS - Math.ceil(COLUMNS / 2),   // midpoint
  (Math.floor(ROWS / 2) * COLUMNS - Math.ceil(COLUMNS / 2)) + COLUMNS,   // tail
]
const CONTAINER = document.getElementById('game')
const ROOT = document.querySelector(':root')
const PAUSE = document.getElementById('pause-button')
const START = document.getElementById('start-button')
const OVERLAY = document.getElementById('overlay')
const SCORE = document.getElementById('score')
const player = []
const state = {
  lost: false,
  paused: false,
  timer: null,
  running: false,
  last: player[player.length - 1],
  score: 0,
  piece: 0,
  direction: INITIAL_DIRECTION,
}
const keystrokes = []
const grid = Array(CELLS).fill(0)

const placePiece = () => {
  const random = Math.floor((Math.random() * CELLS))
  if (player.includes(random)) {
    return placePiece()
  } else {
    state.piece = random
  }
}

const draw = () => {
  if (state.running) {
    Array.from(CONTAINER.querySelectorAll('.cell')).forEach(cell => {
      const id = Number(cell.id)

      cell.classList.toggle('player', player.includes(id))
      cell.classList.toggle('piece', id === state.piece)
      cell.classList.toggle('block-outer', id === state.piece)
      if (id === state.piece && !cell.querySelector('.block-inner')) {
        const inner = document.createElement('div')
        inner.classList.add('block-inner')
        cell.appendChild(inner)
      }
      if (id !== state.piece && cell.querySelector('.block-inner')) {
        cell.removeChild(cell.querySelector('.block-inner'))
      }
    })
  } else {
    CONTAINER.innerHTML = ''
    grid.forEach((item, idx) => {
      const outer = document.createElement('div')
      outer.id = idx
      outer.classList.add('cell')
      outer.classList.toggle('block-outer', idx === state.piece)
      outer.classList.toggle('player', player.includes(idx))
      outer.classList.toggle('piece', idx === state.piece)
      if (idx === state.piece) {
        const inner = document.createElement('div')
        inner.classList.add('block-inner')
        outer.appendChild(inner)
      }
      CONTAINER.appendChild(outer)
    })
  }
}

const nextIndex = (head) => {
  const dirIndices = {
    up: head - COLUMNS,
    down: head + COLUMNS,
    left: head - 1,
    right: head + 1,
  }

  return dirIndices[state.direction]
}

const viability = (head, index) => {
  const viabilityIndices = {
    up: head > COLUMNS - 1 && !player.includes(index),
    down: head < CELLS - COLUMNS && !player.includes(index),
    left: head % COLUMNS > 0 && !player.includes(index),
    right: head % COLUMNS < COLUMNS - 1 && !player.includes(index),
  }

  return viabilityIndices[state.direction]
}

const move = () => {
  const head = player[0]
  const index = nextIndex(head)
  const viable = viability(head, index)

  if (viable) {
    player.pop()
    detectCollision(index)
    player.unshift(index)
  } else {
    endGame()
  }
}

document.addEventListener('keydown', e => {
  if (!state.running) {
    console.log(e.key)
    if (state.paused && ['Enter', ' '].includes(e.key)) {
      startGame()
    } else if (['Enter', ' '].includes(e.key)) {
      init()
    }

    return
  }

  if (e.key === 'Escape') {
    pauseGame()
  }

  const keyDir = e.key.substring(5).toLowerCase()

  if (
    (['up', 'down'].includes(keyDir) && !['up', 'down'].includes(state.direction))
    || (['left', 'right'].includes(keyDir) && !['left', 'right'].includes(state.direction))
  ) {
    if (!state.running) {
      startGame()
    }

    const keystrokeMs = (new Date()).getTime()
    const lastKeystrokeMs = keystrokes.pop()
    keystrokes.push(keystrokeMs)

    if (lastKeystrokeMs) {
      if (keystrokeMs - lastKeystrokeMs < MS) {
        setTimeout(() => {
          state.direction = keyDir
        }, MS - (keystrokeMs - lastKeystrokeMs))
      } else {
        state.direction = keyDir
      }
    } else {
      state.direction = keyDir
    }
  }
})

function detectCollision(head) {
  const collision = {
    up: head < 0,
    down: head > CELLS - 1,
    left: head % COLUMNS < 0,
    right: head % COLUMNS === COLUMNS,
  }

  if (collision[state.direction]) {
    endGame()
  } else if (head === state.piece) {
    player.push(state.last)
    state.score += 10
    SCORE.innerText = state.score
    placePiece()
  }
}

const toggleOverlay = () => {
  OVERLAY.classList.toggle('hidden', state.running)
}

const toggleButtons = () => {
  PAUSE.classList.toggle('hidden', !state.running)
  START.classList.toggle('hidden', state.running)
}

function pauseGame() {
  state.paused = true
  state.running = false
  toggleOverlay()
  document.getElementById('overlay').classList.toggle('overlay--hidden')
  document.getElementById('pause-button').innerText = 'Resume game'
  clearInterval(state.timer)
}

function startGame() {
  state.running = true
  PAUSE.innerText = 'Pause game'

  toggleOverlay()
  toggleButtons()

  state.timer = setInterval(() => {
    move()
    draw()
  }, MS)
}

function endGame() {
  state.running = false
  state.lost = true

  toggleButtons()
  toggleOverlay()

  clearInterval(state.timer)
  console.log('game over')
  START.innerText = 'Play again'
}

function init() {
  while(player.length) {
    player.pop()
  }

  INITIAL_PLAYER.forEach(item => player.push(item))
  grid.fill(0)
  state.direction = INITIAL_DIRECTION
  placePiece()
  draw()

  startGame()
}

document.getElementById('start-button').onclick = () => init()
document.getElementById('pause-button').onclick = (e) => {
  if (state.running) {
    pauseGame()
  } else {
    startGame()
  }
}

document.body.onload = () => {
  ROOT.style.setProperty('--columns', COLUMNS)
  ROOT.style.setProperty('--rows', ROWS)
}
