import Taro from '@tarojs/taro'
import { clearToken, getToken, goLogin } from './auth'

const API_BASE =
  process.env.TARO_APP_API_BASE || 'http://127.0.0.1:3001'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export async function request<T>(
  options: Taro.request.Option & { skipAuth?: boolean },
): Promise<T> {
  const { skipAuth, header, url, ...rest } = options
  const token = getToken()

  const res = await Taro.request({
    ...rest,
    url: url.startsWith('http') ? url : `${API_BASE}${url}`,
    header: {
      'Content-Type': 'application/json',
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...header,
    },
  })

  const statusCode = res.statusCode
  const body = res.data as ApiResponse<T>

  if (statusCode === 401) {
    clearToken()
    await goLogin()
    throw new Error(body?.message || '未登录或登录已过期')
  }

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(body?.message || `请求失败(${statusCode})`)
  }

  if (body && typeof body === 'object' && 'code' in body) {
    if (body.code !== 0) {
      throw new Error(body.message || '业务请求失败')
    }
    return body.data
  }

  return body as T
}
