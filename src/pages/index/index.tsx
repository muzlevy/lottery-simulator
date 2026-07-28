import { useEffect, useMemo, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { Button, Dialog } from "@nutui/nutui-react-taro";
import { clearToken, goLogin } from "../../utils/auth";
import {
  buildConicGradient,
  calcWheelRotateDeg,
  DEFAULT_PRIZES,
  drawLottery,
  fetchLotteryProfile,
  type DrawResult,
} from "../../services/lottery";
import "./index.scss";

const SPIN_MS = 4200;

export default function IndexPage() {
  const [points, setPoints] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rotateDeg, setRotateDeg] = useState(0);
  const [transitionOn, setTransitionOn] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const prizes = DEFAULT_PRIZES;
  const wheelBackground = useMemo(() => buildConicGradient(prizes), [prizes]);

  useDidShow(() => {
    void loadProfile();
  });

  useEffect(() => {
    // 兜底：首次挂载也拉一次积分
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const profile = await fetchLotteryProfile();
      setPoints(profile.points);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "加载用户信息失败";
      Taro.showToast({ title: message, icon: "none" });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setDialogVisible(false);
    setResult(null);

    try {
      const drawResult = await drawLottery();
      const nextDeg = calcWheelRotateDeg(drawResult, rotateDeg, 5);

      setTransitionOn(true);
      setRotateDeg(nextDeg);

      setTimeout(() => {
        setPoints(drawResult.points);
        setResult(drawResult);
        setDialogVisible(true);
        setSpinning(false);
        setTransitionOn(false);
      }, SPIN_MS);
    } catch (error) {
      setSpinning(false);
      setTransitionOn(false);
      const message = error instanceof Error ? error.message : "抽奖失败";
      Taro.showToast({ title: message, icon: "none", duration: 2500 });
    }
  };

  const handleLogout = async () => {
    if (spinning) return;
    clearToken();
    Taro.showToast({ title: "已退出登录", icon: "none" });
    await goLogin();
  };

  const dialogTitle =
    result && result.prizeId === "miss" ? "未中奖" : "恭喜获得";

  const dialogContent = result
    ? result.pointsDelta > 0
      ? `${result.prizeName}（+${result.pointsDelta}），当前积分 ${result.points}`
      : `${result.prizeName}。当前积分 ${result.points}`
    : "";

  return (
    <View className="home-page">
      <View className="home-header">
        <Text className="home-title">幸运抽奖</Text>
        <Text className="home-points">
          当前积分：{loadingProfile ? "..." : points}
        </Text>
        <Text className="home-disclaimer">演示抽奖，无真实资金往来</Text>
      </View>

      <View className="wheel-stage">
        <View className="wheel-pointer" />
        <View
          className="wheel-disk"
          style={{
            background: wheelBackground,
            transform: `rotate(${rotateDeg}deg)`,
            transition: transitionOn
              ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.12, 1)`
              : "none",
          }}
        >
          {prizes.map((prize) => {
            const mid = (prize.startDeg + prize.endDeg) / 2;
            return (
              <View
                key={prize.id}
                className="wheel-label-slot"
                style={{ transform: `rotate(${mid}deg)` }}
              >
                <View className="wheel-label">
                  {Array.from(prize.name).map((char, index) => (
                    <Text
                      key={`${prize.id}-${index}`}
                      className="wheel-label-char"
                    >
                      {char}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
          <View className="wheel-center-cap" />
        </View>
      </View>

      <View className="home-actions">
        <Button
          type="primary"
          block
          loading={spinning}
          disabled={spinning}
          onClick={handleSpin}
        >
          {spinning ? "抽奖中..." : "点击抽奖"}
        </Button>
        <Button
          type="default"
          block
          disabled={spinning}
          className="home-action-gap"
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </View>

      {/* <View className="prize-legend">
        {prizes.map((prize) => (
          <View key={prize.id} className="prize-legend-item">
            <View
              className="prize-dot"
              style={{ backgroundColor: prize.color }}
            />
            <Text className="prize-legend-text">
              {prize.name} {((prize.weight / 10000) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View> */}

      <Dialog
        visible={dialogVisible}
        title={dialogTitle}
        content={dialogContent}
        hideCancelButton
        confirmText="知道了"
        onConfirm={() => setDialogVisible(false)}
        onClose={() => setDialogVisible(false)}
      />
    </View>
  );
}
