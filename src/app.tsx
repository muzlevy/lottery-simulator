import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { clearToken, getToken } from './utils/auth'
import { fetchMe } from './services/auth'

import '@nutui/nutui-react-taro/dist/style.css'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 延后到首屏节点就绪，避免启动瞬间 reLaunch 造成白屏
    Taro.nextTick(() => {
      void bootstrapAuth()
    })
  })

  return children
}

function getCurrentRoute() {
  const pages = Taro.getCurrentPages()
  if (!pages.length) return ''
  const current = pages[pages.length - 1]
  return (current && current.route) || ''
}

async function bootstrapAuth() {
  const token = getToken()
  const route = getCurrentRoute()

  if (!token) {
    if (route !== 'pages/login/index') {
      await Taro.reLaunch({ url: '/pages/login/index' })
    }
    return
  }

  try {
    await fetchMe()
    if (route !== 'pages/index/index') {
      await Taro.reLaunch({ url: '/pages/index/index' })
    }
  } catch {
    clearToken()
    if (route !== 'pages/login/index') {
      await Taro.reLaunch({ url: '/pages/login/index' })
    }
  }
}

export default App
