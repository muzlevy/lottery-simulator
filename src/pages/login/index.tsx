import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import { loginByCode } from '../../services/auth'
import { goHome, setToken } from '../../utils/auth'
import './index.scss'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (loading) return
    setLoading(true)
    try {
      const loginRes = await Taro.login()
      if (!loginRes.code) {
        throw new Error('获取微信登录凭证失败')
      }

      const data = await loginByCode(loginRes.code)
      setToken(data.token)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      await goHome()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '登录失败，请稍后重试'
      Taro.showToast({ title: message, icon: 'none', duration: 2500 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="login-page">
      <View className="login-card">
        <Text className="login-title">幸运抽奖</Text>
        <Text className="login-desc">
          使用微信授权登录后，即可进入主页参与演示抽奖转盘。
        </Text>
        <Button
          type="primary"
          block
          loading={loading}
          onClick={handleLogin}
        >
          微信一键登录
        </Button>
      </View>
    </View>
  )
}
