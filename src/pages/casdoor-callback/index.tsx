import { postAdminCasdoorLogin } from '@/services/modules/admin'
import { history } from '@umijs/max'
import { useRequest } from 'ahooks'
import { Spin, message } from 'antd'
import { useEffect, useRef } from 'react'

export default () => {
  const hasRunRef = useRef(false)
  const { run: casdoorLoginRun } = useRequest(postAdminCasdoorLogin, {
    manual: true,
    onSuccess: (res) => {
      localStorage.token = res.token
      // 整页跳转：setInitialState 与路由守卫的 state 提存在时序竞争，
      // 会被守卫踢回 /login；刷新后 getInitialState 用新 token 拉取完整信息
      window.location.href = '/'
    },
    onError: () => {
      history.replace('/login')
    },
  })

  useEffect(() => {
    // React 18 StrictMode 下 effect 会执行两次，授权码一次性，必须防重入
    if (hasRunRef.current) return
    hasRunRef.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const savedState = sessionStorage.getItem('casdoorState')
    sessionStorage.removeItem('casdoorState')

    if (!code || !state || state !== savedState) {
      message.error('登录状态异常，请重新登录')
      history.replace('/login')
      return
    }
    casdoorLoginRun({ code })
  }, [])

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 16,
        background: 'linear-gradient(135deg, #f7f8fa 0%, #eef0f4 100%)',
      }}
    >
      <Spin size="large" />
      <span style={{ color: '#9ca3af', fontSize: 13, letterSpacing: 2 }}>
        正在登录，请稍候…
      </span>
    </div>
  )
}
