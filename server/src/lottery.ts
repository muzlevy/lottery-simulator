import { randomInt } from "crypto";

export type PrizeId =
  | "miss"
  | "points_2"
  | "points_5"
  | "points_10"
  | "points_50";

export interface Prize {
  id: PrizeId;
  name: string;
  /** 万分比，总和必须为 10000 */
  weight: number;
  /** 扇区起始角度（从 12 点钟方向顺时针，单位度） */
  startDeg: number;
  /** 扇区结束角度 */
  endDeg: number;
  /** 中奖后增加的积分，非积分奖为 0 */
  pointsDelta: number;
  color: string;
}

/**
 * 奖项按顺时针排列，扇区角度 = 概率 * 360
 * 未中奖 50% = 180°
 * 积分+2 20% = 72°
 * 积分+5 15% = 54°
 * 积分+10 10% = 36°
 * 积分+50 5% = 18°
 */
export const PRIZES: Prize[] = [
  {
    id: "points_50",
    name: "积分+50",
    weight: 500,
    startDeg: 0,
    endDeg: 18,
    pointsDelta: 50,
    color: "#FF6B6B",
  },
  {
    id: "miss",
    name: "未中奖",
    weight: 5000,
    startDeg: 18,
    endDeg: 198,
    pointsDelta: 0,
    color: "#94A3B8",
  },
  {
    id: "points_2",
    name: "积分+2",
    weight: 2000,
    startDeg: 198,
    endDeg: 270,
    pointsDelta: 2,
    color: "#F59E0B",
  },
  {
    id: "points_5",
    name: "积分+5",
    weight: 1500,
    startDeg: 270,
    endDeg: 324,
    pointsDelta: 5,
    color: "#34D399",
  },
  {
    id: "points_10",
    name: "积分+10",
    weight: 1000,
    startDeg: 324,
    endDeg: 360,
    pointsDelta: 10,
    color: "#60A5FA",
  },
];

export function pickPrizeByRoll(roll: number): Prize {
  if (roll < 0 || roll > 9999) {
    throw new Error(`roll 超出范围: ${roll}`);
  }

  let cursor = 0;
  for (const prize of PRIZES) {
    cursor += prize.weight;
    if (roll < cursor) {
      return prize;
    }
  }

  return PRIZES[PRIZES.length - 1];
}

export function drawPrize(): Prize {
  return pickPrizeByRoll(randomInt(0, 10000));
}

export function getPrizeCenterDeg(prize: Prize): number {
  return (prize.startDeg + prize.endDeg) / 2;
}
