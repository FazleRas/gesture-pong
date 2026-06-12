import { useEffect, useRef } from 'react'
import './Pong.css'

const WIDTH = 800
const HEIGHT = 500
const PADDLE_WIDTH = 12
const PADDLE_HEIGHT = 90
const PADDLE_SPEED = 6
const BALL_SIZE = 12
const BALL_SPEED = 5

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
}

function createInitialState(): GameState {
  return {
    leftY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    rightY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: WIDTH / 2 - BALL_SIZE / 2,
    ballY: HEIGHT / 2 - BALL_SIZE / 2,
    ballVX: BALL_SPEED,
    ballVY: BALL_SPEED * 0.6,
    leftScore: 0,
    rightScore: 0,
    keys: new Set(),
  }
}

function resetBall(state: GameState, direction: number) {
  state.ballX = WIDTH / 2 - BALL_SIZE / 2
  state.ballY = HEIGHT / 2 - BALL_SIZE / 2
  state.ballVX = BALL_SPEED * direction
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

    const handleKeyDown = (e: KeyboardEvent) => state.keys.add(e.key)
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

      state.ballX += state.ballVX
      state.ballY += state.ballVY

      // Top/bottom walls
      if (state.ballY <= 0 || state.ballY + BALL_SIZE >= HEIGHT) {
        state.ballVY *= -1
        state.ballY = Math.max(0, Math.min(HEIGHT - BALL_SIZE, state.ballY))
      }

      // Left paddle collision
      if (
        state.ballX <= PADDLE_WIDTH &&
        state.ballY + BALL_SIZE >= state.leftY &&
        state.ballY <= state.leftY + PADDLE_HEIGHT &&
        state.ballVX < 0
      ) {
        state.ballVX *= -1.05
        state.ballX = PADDLE_WIDTH
      }

      // Right paddle collision
      if (
        state.ballX + BALL_SIZE >= WIDTH - PADDLE_WIDTH &&
        state.ballY + BALL_SIZE >= state.rightY &&
        state.ballY <= state.rightY + PADDLE_HEIGHT &&
        state.ballVX > 0
      ) {
        state.ballVX *= -1.05
        state.ballX = WIDTH - PADDLE_WIDTH - BALL_SIZE
      }

      // Scoring
      if (state.ballX < 0) {
        state.rightScore += 1
        resetBall(state, 1)
      } else if (state.ballX > WIDTH) {
        state.leftScore += 1
        resetBall(state, -1)
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
      ctx.fillRect(0, state.leftY, PADDLE_WIDTH, PADDLE_HEIGHT)
      ctx.fillRect(WIDTH - PADDLE_WIDTH, state.rightY, PADDLE_WIDTH, PADDLE_HEIGHT)

      // Ball
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE)

      // Score
      ctx.fillStyle = '#f3f4f6'
      ctx.font = '48px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(String(state.leftScore), WIDTH / 2 - 60, 60)
      ctx.fillText(String(state.rightScore), WIDTH / 2 + 60, 60)
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
