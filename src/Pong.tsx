import { useEffect, useRef } from 'react'
import './Pong.css'

const WIDTH = 800
const HEIGHT = 500
const PADDLE_WIDTH = 12
const PADDLE_HEIGHT = 90
const PADDLE_SPEED = 6
const PADDLE_MARGIN = 24
const BALL_SIZE = 12
const BALL_SPEED = 5
const SERVE_DELAY_MS = 1500

type Phase = 'start' | 'countdown' | 'playing'

interface GameState {
  leftY: number
  rightY: number
  ballX: number
  ballY: number
  ballVX: number
  ballVY: number
  leftScore: number
  rightScore: number
  keys: Set<string>
  phase: Phase
  serveDirection: number
  serveAt: number
}

function createInitialState(): GameState {
  return {
    leftY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    rightY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: WIDTH / 2 - BALL_SIZE / 2,
    ballY: HEIGHT / 2 - BALL_SIZE / 2,
    ballVX: 0,
    ballVY: 0,
    leftScore: 0,
    rightScore: 0,
    keys: new Set(),
    phase: 'start',
    serveDirection: 1,
    serveAt: 0,
  }
}

function centerBall(state: GameState) {
  state.ballX = WIDTH / 2 - BALL_SIZE / 2
  state.ballY = HEIGHT / 2 - BALL_SIZE / 2
  state.ballVX = 0
  state.ballVY = 0
}

function serveBall(state: GameState) {
  state.ballVX = BALL_SPEED * state.serveDirection
  state.ballVY = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1) * 0.6
}

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(createInitialState())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = stateRef.current

    const handleKeyDown = (e: KeyboardEvent) => {
      state.keys.add(e.key)
      if (e.key === ' ' && state.phase === 'start') {
        e.preventDefault()
        state.phase = 'playing'
        serveBall(state)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => state.keys.delete(e.key)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    let animationFrame: number

    const update = () => {
      // Left paddle: W/S
      if (state.keys.has('w') || state.keys.has('W')) state.leftY -= PADDLE_SPEED
      if (state.keys.has('s') || state.keys.has('S')) state.leftY += PADDLE_SPEED

      // Right paddle: Arrow Up/Down
      if (state.keys.has('ArrowUp')) state.rightY -= PADDLE_SPEED
      if (state.keys.has('ArrowDown')) state.rightY += PADDLE_SPEED

      state.leftY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, state.leftY))
      state.rightY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, state.rightY))

      if (state.phase === 'countdown' && Date.now() >= state.serveAt) {
        state.phase = 'playing'
        serveBall(state)
      }

      if (state.phase !== 'playing') return

      state.ballX += state.ballVX
      state.ballY += state.ballVY

      // Top/bottom walls
      if (state.ballY <= 0 || state.ballY + BALL_SIZE >= HEIGHT) {
        state.ballVY *= -1
        state.ballY = Math.max(0, Math.min(HEIGHT - BALL_SIZE, state.ballY))
      }

      // Left paddle collision
      if (
        state.ballX <= PADDLE_MARGIN + PADDLE_WIDTH &&
        state.ballY + BALL_SIZE >= state.leftY &&
        state.ballY <= state.leftY + PADDLE_HEIGHT &&
        state.ballVX < 0
      ) {
        state.ballVX *= -1.05
        state.ballX = PADDLE_MARGIN + PADDLE_WIDTH
      }

      // Right paddle collision
      if (
        state.ballX + BALL_SIZE >= WIDTH - PADDLE_MARGIN - PADDLE_WIDTH &&
        state.ballY + BALL_SIZE >= state.rightY &&
        state.ballY <= state.rightY + PADDLE_HEIGHT &&
        state.ballVX > 0
      ) {
        state.ballVX *= -1.05
        state.ballX = WIDTH - PADDLE_MARGIN - PADDLE_WIDTH - BALL_SIZE
      }

      // Scoring
      if (state.ballX < 0) {
        state.rightScore += 1
        state.serveDirection = 1
        centerBall(state)
        state.phase = 'countdown'
        state.serveAt = Date.now() + SERVE_DELAY_MS
      } else if (state.ballX > WIDTH) {
        state.leftScore += 1
        state.serveDirection = -1
        centerBall(state)
        state.phase = 'countdown'
        state.serveAt = Date.now() + SERVE_DELAY_MS
      }
    }

    const draw = () => {
      ctx.fillStyle = '#0d0f14'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      // Center line
      ctx.strokeStyle = '#2e303a'
      ctx.setLineDash([8, 12])
      ctx.beginPath()
      ctx.moveTo(WIDTH / 2, 0)
      ctx.lineTo(WIDTH / 2, HEIGHT)
      ctx.stroke()
      ctx.setLineDash([])

      // Paddles
      ctx.fillStyle = '#c084fc'
      ctx.fillRect(PADDLE_MARGIN, state.leftY, PADDLE_WIDTH, PADDLE_HEIGHT)
      ctx.fillRect(WIDTH - PADDLE_MARGIN - PADDLE_WIDTH, state.rightY, PADDLE_WIDTH, PADDLE_HEIGHT)

      // Ball
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE)

      // Score
      ctx.fillStyle = '#f3f4f6'
      ctx.font = '48px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(String(state.leftScore), WIDTH / 2 - 60, 60)
      ctx.fillText(String(state.rightScore), WIDTH / 2 + 60, 60)

      // Overlay text
      if (state.phase === 'start') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '28px ui-monospace, monospace'
        ctx.fillText('Press SPACE to start', WIDTH / 2, HEIGHT / 2 + 60)
      } else if (state.phase === 'countdown') {
        const secondsLeft = Math.max(0, Math.ceil((state.serveAt - Date.now()) / 1000))
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '28px ui-monospace, monospace'
        ctx.fillText(secondsLeft > 0 ? String(secondsLeft) : '', WIDTH / 2, HEIGHT / 2 + 60)
      }
    }

    const loop = () => {
      update()
      draw()
      animationFrame = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="pong">
      <h1>Gesture Pong</h1>
      <p className="hint">P1: W / S &nbsp;&nbsp;|&nbsp;&nbsp; P2: Arrow Up / Down</p>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
    </div>
  )
}
