import type { PostAdminLoginReq } from '@/services/modules/admin'
import { postAdminLogin } from '@/services/modules/admin'
import { getPublicConfig } from '@/services/modules/system-config'
import { completeImgUrl } from '@/utils/utils'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { history, useModel } from '@umijs/max'
import { useRequest } from 'ahooks'
import { Button, Divider, Form, Input, message } from 'antd'
import React from 'react'

// ===== 极简 SVG 图标 =====

// 耳机图标（方角工业风）
const HeadphoneIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = 'currentColor',
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M6 18 V16 a10 10 0 0 1 20 0 V18" stroke={color} strokeWidth="2" fill="none" />
    <rect x="4" y="17" width="5" height="9" fill={color} />
    <rect x="23" y="17" width="5" height="9" fill={color} />
    <rect x="4" y="17" width="5" height="9" fill="none" stroke={color} strokeWidth="1.5" />
    <rect x="23" y="17" width="5" height="9" fill="none" stroke={color} strokeWidth="1.5" />
  </svg>
)

// 音符
const Note: React.FC<{ style?: React.CSSProperties; delay?: number }> = ({ style, delay = 0 }) => (
  <div
    style={{
      position: 'absolute',
      ...style,
      animation: `loginNoteFloat 6s ease-in-out ${delay}s infinite`,
    }}
  >
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
      <rect x="1" y="2" width="2" height="14" fill="currentColor" />
      <rect x="13" y="0" width="2" height="16" fill="currentColor" />
      <rect x="1" y="0" width="14" height="2" fill="currentColor" />
      <rect x="0" y="14" width="6" height="6" fill="currentColor" />
      <rect x="12" y="12" width="6" height="6" fill="currentColor" />
    </svg>
  </div>
)

// 声波线条
const Wave: React.FC<{
  style?: React.CSSProperties
  duration?: number
  delay?: number
  width?: number
}> = ({ style, duration = 4, delay = 0, width = 60 }) => (
  <div
    style={{
      position: 'absolute',
      width: `${width}px`,
      height: '2px',
      background: 'currentColor',
      ...style,
      transformOrigin: 'left center',
      animation: `loginWave ${duration}s ease-in-out ${delay}s infinite`,
    }}
  />
)

// 同心圆扩散波（耳机发声感）
const RippleCircles: React.FC<{
  style?: React.CSSProperties
  size?: number
  color?: string
  duration?: number
}> = ({ style, size = 200, color = '#e8e8e8', duration = 4 }) => (
  <div
    style={{
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      ...style,
    }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          inset: 0,
          border: `1px solid ${color}`,
          borderRadius: '50%',
          animation: `loginRipple ${duration}s ease-out ${i * (duration / 3)}s infinite`,
        }}
      />
    ))}
  </div>
)

// 超大耳机水印
const BigHeadphone: React.FC<{ style?: React.CSSProperties; color?: string }> = ({
  style,
  color = '#f0f0f0',
}) => (
  <div style={{ position: 'absolute', ...style }}>
    <svg width="360" height="360" viewBox="0 0 360 360" fill="none">
      {/* 头梁 */}
      <path d="M60 200 V180 a120 120 0 0 1 240 0 V200" stroke={color} strokeWidth="6" fill="none" />
      {/* 左耳罩 */}
      <rect x="40" y="195" width="60" height="110" fill={color} />
      <rect x="52" y="207" width="36" height="86" fill="none" stroke="#ffffff" strokeWidth="2" />
      {/* 右耳罩 */}
      <rect x="260" y="195" width="60" height="110" fill={color} />
      <rect x="272" y="207" width="36" height="86" fill="none" stroke="#ffffff" strokeWidth="2" />
      {/* 左侧声波小线 */}
      <line x1="20" y1="225" x2="35" y2="225" stroke={color} strokeWidth="3" />
      <line x1="15" y1="250" x2="35" y2="250" stroke={color} strokeWidth="3" />
      <line x1="20" y1="275" x2="35" y2="275" stroke={color} strokeWidth="3" />
      {/* 右侧声波小线 */}
      <line x1="325" y1="225" x2="340" y2="225" stroke={color} strokeWidth="3" />
      <line x1="325" y1="250" x2="345" y2="250" stroke={color} strokeWidth="3" />
      <line x1="325" y1="275" x2="340" y2="275" stroke={color} strokeWidth="3" />
    </svg>
  </div>
)

// 有线入耳式耳机
const WiredIEM: React.FC<{ style?: React.CSSProperties; color?: string }> = ({
  style,
  color = '#dfe3eb',
}) => (
  <div style={{ position: 'absolute', ...style }}>
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      {/* 左侧线 */}
      <path
        d="M30 10 Q22 30 30 50 Q38 70 30 90 L30 100"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      {/* 右侧线 */}
      <path
        d="M90 10 Q98 30 90 50 Q82 70 90 90 L90 100"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      {/* 分线器 */}
      <circle cx="30" cy="10" r="3" fill={color} />
      <circle cx="90" cy="10" r="3" fill={color} />
      <path d="M30 10 L60 4 L90 10" stroke={color} strokeWidth="2.5" fill="none" />
      {/* 左耳塞 */}
      <rect x="22" y="100" width="16" height="14" rx="3" fill={color} />
      <rect x="25" y="104" width="10" height="6" rx="1.5" fill="#ffffff" opacity="0.6" />
      {/* 右耳塞 */}
      <rect x="82" y="100" width="16" height="14" rx="3" fill={color} />
      <rect x="85" y="104" width="10" height="6" rx="1.5" fill="#ffffff" opacity="0.6" />
    </svg>
  </div>
)

// 桌面音响 / 喇叭
const Speaker: React.FC<{ style?: React.CSSProperties; color?: string }> = ({
  style,
  color = '#dfe3eb',
}) => (
  <div style={{ position: 'absolute', ...style }}>
    <svg width="100" height="120" viewBox="0 0 100 120" fill="none">
      {/* 主体方箱 */}
      <rect x="10" y="10" width="80" height="100" fill={color} />
      {/* 高音单元 */}
      <circle cx="50" cy="32" r="9" fill="#ffffff" opacity="0.5" />
      <circle cx="50" cy="32" r="4" fill={color} />
      {/* 低音单元 */}
      <circle cx="50" cy="74" r="22" fill="#ffffff" opacity="0.5" />
      <circle cx="50" cy="74" r="14" fill={color} />
      <circle cx="50" cy="74" r="5" fill="#ffffff" opacity="0.5" />
      {/* 底部细节线 */}
      <rect x="10" y="102" width="80" height="8" fill="#ffffff" opacity="0.2" />
    </svg>
  </div>
)

// 黑胶唱片（旋转）
const VinylDisc: React.FC<{ style?: React.CSSProperties; color?: string }> = ({
  style,
  color = '#d8dce4',
}) => (
  <div
    style={{
      position: 'absolute',
      ...style,
      animation: 'loginSpin 12s linear infinite',
    }}
  >
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
      <circle cx="70" cy="70" r="68" fill={color} />
      <circle
        cx="70"
        cy="70"
        r="56"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <circle
        cx="70"
        cy="70"
        r="44"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <circle
        cx="70"
        cy="70"
        r="32"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <circle cx="70" cy="70" r="20" fill="#b8a8c8" />
      <circle cx="70" cy="70" r="4" fill="#ffffff" opacity="0.7" />
    </svg>
  </div>
)

// ===== 迁移适配 =====
const DEFAULT_BRAND_TITLE = 'MOONDROP 运营支撑系统'
const DEFAULT_SUBTITLE = '水月雨 · 听见理性的声音'

export default function LoginPage() {
  const [form] = Form.useForm<PostAdminLoginReq>()
  const { data: publicConfig } = useRequest(getPublicConfig, {
    onError: () => {},
  })
  const { loading: postAdminLoginLoading, run: postAdminLoginRun } = useRequest(postAdminLogin, {
    manual: true,
    onSuccess: (res) => {
      message.success('登录成功')
      localStorage.token = res.token
      // 整页跳转：setInitialState 与 history.push 的 state 提交不在同一 commit，
      // 守卫 effect 会读到旧登录态把页面踢回 /login；刷新后 getInitialState
      // 用新 token 拉取完整管理员信息（用户名、头像）
      window.location.href = '/'
    },
  })

  // Casdoor SSO 登录
  const redirectToCasdoor = () => {
    const endpoint = (ENV.casdoorEndpoint as string) || ''
    const clientId = (ENV.casdoorClientId as string) || ''
    if (!endpoint || !clientId) {
      message.info('SSO 登录暂未配置')
      return
    }
    const state = Math.random().toString(36).slice(2, 10)
    sessionStorage.setItem('casdoorState', state)
    // 用 history.createHref 自动处理 base 路径（dev 为空，prod 为 /new/）
    const redirectPath = history.createHref({ pathname: '/casdoor-callback' })
    const redirectUri = `${window.location.origin}${redirectPath}`
    const authorizeUrl =
      `${endpoint}/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=openid email profile` +
      `&state=${state}`
    window.location.href = authorizeUrl
  }

  return (
    <>
      <style>{`
        @keyframes loginNoteFloat {
          0%, 100% { transform: translateY(0) rotate(-8deg); opacity: 0.2; }
          50% { transform: translateY(-14px) rotate(8deg); opacity: 0.55; }
        }
        @keyframes loginWave {
          0%, 100% { transform: scaleX(0.4); opacity: 0.15; }
          50% { transform: scaleX(1); opacity: 0.5; }
        }
        @keyframes loginRipple {
          0% { transform: scale(0.4); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes loginFadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes loginSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .login-card .ant-input-affix-wrapper,
        .login-card .ant-input {
          border-width: 1px !important;
        }
        .login-card .ant-input-affix-wrapper:focus,
        .login-card .ant-input-affix-wrapper-focused,
        .login-card .ant-input:focus,
        .login-card .ant-input-affix-wrapper-focused:hover,
        .login-card .ant-input-affix-wrapper:focus:hover {
          border-color: #141414 !important;
          box-shadow: none !important;
        }
        .login-card .ant-input-affix-wrapper:hover {
          border-color: #757575 !important;
        }
        .login-card .ant-btn-primary:focus,
        .login-card .ant-btn-primary:active,
        .login-card .ant-btn-primary:hover {
          background: #141414 !important;
          border-color: #141414 !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .login-card .ant-btn-primary[ant-click-animating-without-extra-node]:after {
          display: none !important;
        }
        .login-card .ant-input-affix-wrapper.has-error,
        .login-card .ant-form-item-has-error .ant-input-affix-wrapper {
          border-color: #d9363e !important;
        }
        .login-card .ant-form-item-explain-error {
          color: #8a2a2e !important;
          font-size: 12px !important;
          letter-spacing: 0.3px !important;
          font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif !important;
          margin-top: 6px !important;
          margin-bottom: 2px !important;
          line-height: 1.6 !important;
        }
        .login-card .ant-form-item-has-error {
          margin-bottom: 24px !important;
        }
        .login-card .ant-input-affix-wrapper input:-webkit-autofill,
        .login-card .ant-input-affix-wrapper input:-webkit-autofill:hover,
        .login-card .ant-input-affix-wrapper input:-webkit-autofill:focus,
        .login-card .ant-input-affix-wrapper input:-webkit-autofill:active {
          -webkit-text-fill-color: #333333 !important;
          caret-color: #333333 !important;
          transition: background-color 99999s ease-in-out 0s !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
        }
        .third-party-login-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          padding: 8px;
          margin: 0 auto;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }
        .third-party-login-button:hover {
          border-color: #e5e7eb;
          background: #f7f8fa;
          transform: translateY(-2px);
        }
        .third-party-login-button:focus-visible {
          border-color: #141414;
          outline: 2px solid rgba(20, 20, 20, 0.16);
          outline-offset: 2px;
        }
        .third-party-login-button:active {
          transform: translateY(0);
        }
        .third-party-login-button img {
          display: block;
          width: 40px;
          height: 40px;
          object-fit: contain;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #f7f8fa 0%, #eef0f4 100%)',
          fontFamily:
            '-apple-system, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* 网格底纹 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(#e6ebf2 1px, transparent 1px), linear-gradient(90deg, #e6ebf2 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none',
          }}
        />

        {/* 超大耳机水印（左下） */}
        <BigHeadphone
          style={{
            bottom: '-80px',
            left: '-60px',
            opacity: 0.85,
            transform: 'rotate(-15deg)',
          }}
          color="#dfe3eb"
        />

        {/* 超大耳机水印（右上，更淡更小） */}
        <BigHeadphone
          style={{
            top: '-90px',
            right: '-70px',
            opacity: 0.6,
            transform: 'rotate(165deg) scale(0.85)',
          }}
          color="#dfe3eb"
        />

        {/* 同心圆扩散波（左上，耳机发声感） */}
        <RippleCircles
          style={{ top: '12%', left: '10%' }}
          size={180}
          color="#c8d0dc"
          duration={4}
        />

        {/* 同心圆扩散波（右下） */}
        <RippleCircles
          style={{ bottom: '14%', right: '12%' }}
          size={160}
          color="#c8d0dc"
          duration={4.8}
        />

        {/* 几何方块点缀（方角工业风） */}
        <div
          style={{
            position: 'absolute',
            top: '24%',
            right: '22%',
            width: '14px',
            height: '14px',
            border: '1px solid #c8d0dc',
            transform: 'rotate(0deg)',
            animation: 'loginBlink 4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '30%',
            left: '22%',
            width: '10px',
            height: '10px',
            background: '#d4dae3',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '68%',
            right: '18%',
            width: '8px',
            height: '40px',
            background: '#dfe3eb',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '40%',
            width: '24px',
            height: '1px',
            background: '#c8d0dc',
          }}
        />

        {/* 背景装饰：声波线条（左中） */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '14%',
            color: '#cdd3dc',
          }}
        >
          <Wave style={{ width: 50, top: '-18px' }} duration={3.2} delay={0} />
          <Wave style={{ width: 80, top: '0' }} duration={4} delay={0.5} />
          <Wave style={{ width: 60, top: '18px' }} duration={4.6} delay={0.2} />
        </div>

        {/* 背景装饰：声波线条（右中） */}
        <div
          style={{
            position: 'absolute',
            top: '55%',
            right: '14%',
            color: '#cdd3dc',
          }}
        >
          <Wave style={{ width: 70, top: '-18px' }} duration={4} delay={0.3} />
          <Wave style={{ width: 90, top: '0' }} duration={4.6} delay={0.9} />
          <Wave style={{ width: 50, top: '18px' }} duration={3.2} delay={1.2} />
        </div>

        {/* 背景装饰：飘动音符 */}
        <Note style={{ top: '20%', left: '34%', color: '#d4dae3' }} delay={0} />
        <Note style={{ top: '28%', right: '34%', color: '#d4dae3' }} delay={1.5} />
        <Note style={{ bottom: '28%', left: '32%', color: '#d4dae3' }} delay={0.8} />
        <Note style={{ bottom: '22%', right: '34%', color: '#d4dae3' }} delay={2} />

        {/* 卡片附近：有线入耳耳机（左上） */}
        <WiredIEM
          style={{ top: '18%', left: '22%', opacity: 0.55, transform: 'rotate(-12deg)' }}
          color="#cdd3dc"
        />

        {/* 卡片附近：桌面音响（右中） */}
        <Speaker
          style={{ top: '44%', right: '20%', opacity: 0.5, transform: 'rotate(6deg)' }}
          color="#cdd3dc"
        />

        {/* 卡片附近：黑胶唱片（左下，旋转） */}
        <VinylDisc style={{ bottom: '16%', left: '20%', opacity: 0.45 }} color="#d4dae3" />

        {/* 卡片附近：有线入耳耳机（右下小） */}
        <WiredIEM
          style={{
            bottom: '20%',
            right: '24%',
            opacity: 0.4,
            transform: 'rotate(165deg) scale(0.7)',
          }}
          color="#cdd3dc"
        />

        {/* ===== 登录卡片 ===== */}
        <div
          className="login-card"
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '380px',
            padding: '44px 40px 32px',
            background: '#ffffff',
            border: '1px solid #eeeeee',
            boxShadow: '0 1px 0 rgba(20,20,20,0.02), 0 12px 32px rgba(20,20,20,0.04)',
            animation: 'loginFadeInUp 0.7s ease both',
            boxSizing: 'border-box',
          }}
        >
          {/* 顶部标题 */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {publicConfig?.['site.logo_light'] ? (
                <img
                  src={completeImgUrl(publicConfig['site.logo_light'])}
                  alt={publicConfig?.['site.title'] || DEFAULT_BRAND_TITLE}
                  style={{ height: 28 }}
                />
              ) : (
                <HeadphoneIcon size={26} color="#141414" />
              )}
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#141414',
                  letterSpacing: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {publicConfig?.['site.title'] || DEFAULT_BRAND_TITLE}
              </span>
            </div>
            {publicConfig?.['site.subtitle'] !== '' ? (
              <div
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginTop: '6px',
                  letterSpacing: '2px',
                  paddingLeft: publicConfig?.['site.logo_light'] ? '0' : '38px',
                }}
              >
                {publicConfig?.['site.subtitle'] || DEFAULT_SUBTITLE}
              </div>
            ) : null}
          </div>

          {/* 表单 */}
          <Form
            form={form}
            size="large"
            onFinish={(values) => {
              postAdminLoginRun(values)
            }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
              style={{ marginBottom: '18px' }}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="用户名"
                style={{
                  borderRadius: '0',
                  height: '46px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
              style={{ marginBottom: '22px' }}
            >
              <Input
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="密码"
                type="password"
                style={{
                  borderRadius: '0',
                  height: '46px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                block
                loading={postAdminLoginLoading}
                style={{
                  height: '46px',
                  fontSize: '14px',
                  letterSpacing: '6px',
                  borderRadius: '0',
                  border: 'none',
                  marginTop: '10px',
                  background: '#141414',
                }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          {/* 第三方登录入口 */}
          <Divider
            plain
            style={{
              margin: '34px 0 16px',
              color: '#9ca3af',
              fontSize: '12px',
              letterSpacing: '2px',
            }}
          >
            第三方登录方式
          </Divider>
          <button
            type="button"
            className="third-party-login-button"
            onClick={redirectToCasdoor}
            title="水月雨统一认证登录"
            aria-label="水月雨统一认证登录"
          >
            <img
              src="https://cn.cdn.moondroplab.com/625fb843a8046c1c7861d89e/626fd458d107ab020cfa3efb_logo.svg"
              alt="水月雨"
            />
          </button>
        </div>
      </div>
    </>
  )
}
