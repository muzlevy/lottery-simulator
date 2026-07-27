import { request } from '../utils/request'

export interface LoginResult {
  token: string
  user: {
    openid: string
    points: number
  }
}

export interface MeResult {
  openid: string
  points: number
}

export function loginByCode(code: string) {
  return request<LoginResult>({
    url: '/api/auth/login',
    method: 'POST',
    data: { code },
    skipAuth: true,
  })
}

export function fetchMe() {
  return request<MeResult>({
    url: '/api/auth/me',
    method: 'GET',
  })
}
