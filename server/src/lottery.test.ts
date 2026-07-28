import assert from 'assert'
import { pickPrizeByRoll, PRIZES } from './lottery'

function testWeightSum() {
  const sum = PRIZES.reduce((acc, prize) => acc + prize.weight, 0)
  assert.strictEqual(sum, 10000, '奖项权重总和应为 10000')
}

function testBoundaryMapping() {
  assert.strictEqual(pickPrizeByRoll(0).id, 'points_50')
  assert.strictEqual(pickPrizeByRoll(499).id, 'points_50')
  assert.strictEqual(pickPrizeByRoll(500).id, 'miss')
  assert.strictEqual(pickPrizeByRoll(5499).id, 'miss')
  assert.strictEqual(pickPrizeByRoll(5500).id, 'points_2')
  assert.strictEqual(pickPrizeByRoll(7499).id, 'points_2')
  assert.strictEqual(pickPrizeByRoll(7500).id, 'points_5')
  assert.strictEqual(pickPrizeByRoll(8999).id, 'points_5')
  assert.strictEqual(pickPrizeByRoll(9000).id, 'points_10')
  assert.strictEqual(pickPrizeByRoll(9999).id, 'points_10')
}

function testSectorDegrees() {
  for (const prize of PRIZES) {
    const span = prize.endDeg - prize.startDeg
    const expected = (prize.weight / 10000) * 360
    assert.ok(Math.abs(span - expected) < 0.0001, `${prize.id} 扇区角度不匹配`)
  }
}

function testPointsDelta() {
  const expected: Record<string, number> = {
    points_50: 50,
    miss: 0,
    points_2: 2,
    points_5: 5,
    points_10: 10,
  }

  for (const prize of PRIZES) {
    assert.strictEqual(
      prize.pointsDelta,
      expected[prize.id],
      `${prize.id} pointsDelta 应为 ${expected[prize.id]}`,
    )
  }
}

testWeightSum()
testBoundaryMapping()
testSectorDegrees()
testPointsDelta()
console.log('[lottery] boundary tests passed')
