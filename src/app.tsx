import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { clearToken, getToken } from './utils/auth'
import { fetchMe } from './services/auth'

import '@nutui/nutui-react-taro/dist/style.css'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    void bootstrapAuth()
  })

  return children
}

async function bootstrapAuth() {
  const token = getToken()
  if (!token) {
    await Taro.reLaunch({ url: '/pages/login/index' })
    return
  }

  try {
    await fetchMe()
    await Taro.reLaunch({ url: '/pages/index/index' })
  } catch {
    clearToken()
    await Taro.reLaunch({ url: '/pages/login/index' })
  }
}

export default App
