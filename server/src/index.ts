import cors from 'cors'
import dotenv from 'dotenv'
import express, { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { drawPrize, PRIZES } from './lottery'
import { addPoints, getOrCreateUser } from './store'

dotenv.config()

const PORT = Number(process.env.PORT || 3001)
const WECHAT_APPID = process.env.WECHAT_APPID || ''
const WECHAT_SECRET = process.env.WECHAT_SECRET || ''
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

interface AuthPayload {
  openid: string
}

interface AuthedRequest extends Request {
  user?: AuthPayload
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ code: 0, message: 'ok', data: { ok: true } })
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim()
    if (!code) {
      res.status(400).json({ code: 400, message: '缺少 code', data: null })
      return
    }

    if (!WECHAT_APPID || !WECHAT_SECRET || WECHAT_APPID === 'your_wechat_appid') {
      res.status(500).json({
        code: 500,
        message: '服务端未配置 WECHAT_APPID / WECHAT_SECRET，请先填写 server/.env',
        data: null,
      })
      return
    }

    const session = await code2Session(code)
    if (session.errcode) {
      const hint =
        session.errcode === 40029
          ? '（多为小程序 AppID 与 server/.env 不一致，或使用了游客/测试号）'
          : ''
      res.status(400).json({
        code: session.errcode,
        message: `${session.errmsg || '微信登录失败'}${hint}`,
        data: null,
      })
      return
    }

    if (!session.openid) {
      res.status(400).json({
        code: 400,
        message: '未获取到 openid',
        data: null,
      })
      return
    }

    const token = jwt.sign({ openid: session.openid } satisfies AuthPayload, JWT_SECRET, {
      expiresIn: '7d',
    })

    const user = getOrCreateUser(session.openid)

    res.json({
      code: 0,
      message: 'ok',
      data: {
        token,
        user: {
          openid: session.openid,
          points: user.points,
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败'
    res.status(500).json({ code: 500, message, data: null })
  }
})

app.get('/api/auth/me', authMiddleware, (req: AuthedRequest, res) => {
  const user = getOrCreateUser(req.user!.openid)
  res.json({
    code: 0,
    message: 'ok',
    data: {
      openid: user.openid,
      points: user.points,
    },
  })
})

app.get('/api/lottery/prizes', (_req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      prizes: PRIZES.map((prize) => ({
        id: prize.id,
        name: prize.name,
        weight: prize.weight,
        startDeg: prize.startDeg,
        endDeg: prize.endDeg,
        pointsDelta: prize.pointsDelta,
        color: prize.color,
      })),
      disclaimer: '演示抽奖，无真实资金往来',
    },
  })
})

app.get('/api/lottery/profile', authMiddleware, (req: AuthedRequest, res) => {
  const user = getOrCreateUser(req.user!.openid)
  res.json({
    code: 0,
    message: 'ok',
    data: {
      openid: user.openid,
      points: user.points,
    },
  })
})

app.post('/api/lottery/draw', authMiddleware, (req: AuthedRequest, res) => {
  try {
    const prize = drawPrize()
    const user =
      prize.pointsDelta > 0
        ? addPoints(req.user!.openid, prize.pointsDelta)
        : getOrCreateUser(req.user!.openid)

    res.json({
      code: 0,
      message: 'ok',
      data: {
        prizeId: prize.id,
        prizeName: prize.name,
        pointsDelta: prize.pointsDelta,
        points: user.points,
        color: prize.color,
        startDeg: prize.startDeg,
        endDeg: prize.endDeg,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '抽奖失败'
    res.status(500).json({ code: 500, message, data: null })
  }
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ code: 500, message: err.message || '服务器错误', data: null })
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://127.0.0.1:${PORT}`)
})

function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    res.status(401).json({ code: 401, message: '未登录', data: null })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    if (!payload?.openid) {
      res.status(401).json({ code: 401, message: '登录态无效', data: null })
      return
    }
    req.user = { openid: payload.openid }
    next()
  } catch {
    res.status(401).json({ code: 401, message: '登录已过期', data: null })
  }
}

async function code2Session(code: string) {
  const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
  url.searchParams.set('appid', WECHAT_APPID)
  url.searchParams.set('secret', WECHAT_SECRET)
  url.searchParams.set('js_code', code)
  url.searchParams.set('grant_type', 'authorization_code')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`微信接口 HTTP ${response.status}`)
  }

  return (await response.json()) as {
    openid?: string
    session_key?: string
    unionid?: string
    errcode?: number
    errmsg?: string
  }
}
