import { request } from '../utils/request'

export type PrizeId =
  | 'miss'
  | 'points_2'
  | 'points_5'
  | 'points_10'
  | 'points_50'

export interface PrizeMeta {
  id: PrizeId
  name: string
  weight: number
  startDeg: number
  endDeg: number
  pointsDelta: number
  color: string
}

/** 与服务端保持一致的默认奖项配置（用于绘制转盘） */
export const DEFAULT_PRIZES: PrizeMeta[] = [
  {
    id: 'points_50',
    name: '积分+50',
    weight: 500,
    startDeg: 0,
    endDeg: 18,
    pointsDelta: 50,
    color: '#FF6B6B',
  },
  {
    id: 'miss',
    name: '未中奖',
    weight: 5000,
    startDeg: 18,
    endDeg: 198,
    pointsDelta: 0,
    color: '#94A3B8',
  },
  {
    id: 'points_2',
    name: '积分+2',
    weight: 2000,
    startDeg: 198,
    endDeg: 270,
    pointsDelta: 2,
    color: '#F59E0B',
  },
  {
    id: 'points_5',
    name: '积分+5',
    weight: 1500,
    startDeg: 270,
    endDeg: 324,
    pointsDelta: 5,
    color: '#34D399',
  },
  {
    id: 'points_10',
    name: '积分+10',
    weight: 1000,
    startDeg: 324,
    endDeg: 360,
    pointsDelta: 10,
    color: '#60A5FA',
  },
]

export interface LotteryProfile {
  openid: string
  points: number
}

export interface DrawResult {
  prizeId: PrizeId
  prizeName: string
  pointsDelta: number
  points: number
  color: string
  startDeg: number
  endDeg: number
}

export function fetchLotteryProfile() {
  return request<LotteryProfile>({
    url: '/api/lottery/profile',
    method: 'GET',
  })
}

export function drawLottery() {
  return request<DrawResult>({
    url: '/api/lottery/draw',
    method: 'POST',
  })
}

export function getPrizeCenterDeg(prize: Pick<PrizeMeta, 'startDeg' | 'endDeg'>) {
  return (prize.startDeg + prize.endDeg) / 2
}

/** 计算转盘最终角度：指针固定在顶部，奖项中心对齐指针 */
export function calcWheelRotateDeg(
  prize: Pick<PrizeMeta, 'startDeg' | 'endDeg'>,
  currentDeg: number,
  extraTurns = 5,
) {
  const centerDeg = getPrizeCenterDeg(prize)
  const targetMod = (360 - centerDeg + 360) % 360
  const currentMod = ((currentDeg % 360) + 360) % 360
  let delta = targetMod - currentMod
  if (delta <= 0) {
    delta += 360
  }
  return currentDeg + extraTurns * 360 + delta
}

export function buildConicGradient(prizes: PrizeMeta[]) {
  const stops = prizes
    .map((prize) => `${prize.color} ${prize.startDeg}deg ${prize.endDeg}deg`)
    .join(', ')
  return `conic-gradient(${stops})`
}
