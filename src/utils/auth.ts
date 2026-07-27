import Taro from '@tarojs/taro'

const TOKEN_KEY = 'AUTH_TOKEN'

export function getToken(): string {
  return Taro.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  Taro.setStorageSync(TOKEN_KEY, token)
}

export function clearToken() {
  Taro.removeStorageSync(TOKEN_KEY)
}

export function goLogin() {
  return Taro.reLaunch({ url: '/pages/login/index' })
}

export function goHome() {
  return Taro.reLaunch({ url: '/pages/index/index' })
}
