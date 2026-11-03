import { postAdminLogin } from '@/services/modules/admin';
import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { ProFormCheckbox, ProFormText, LoginForm } from '@ant-design/pro-components';
import { history, FormattedMessage, useIntl } from '@umijs/max';
import { message } from 'antd';
import styles from './index.less';

export default function LoginPage() {
  const intl = useIntl();

  const handleFinish = async (values: { username: string; password: string }) => {
    const res = await postAdminLogin(values);
    localStorage.setItem('token', res.token);
    message.success(intl.formatMessage({ id: 'login.success' }));
    history.push('/');
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.brandArea}>
        <div className={styles.brandMark}>M</div>
        <div className={styles.brandName}>MOONDROP</div>
      </div>

      <div className={styles.heroArea}>
        <h1 className={styles.heroTitle}>
          <FormattedMessage id="login.hero.title" />
        </h1>
        <p className={styles.heroSubtitle}>
          <FormattedMessage id="login.hero.subtitle" />
        </p>
        <div className={styles.heroPoints}>
          <div className={styles.heroPoint}>
            <strong>
              <FormattedMessage id="login.hero.point1.title" />
            </strong>
            <FormattedMessage id="login.hero.point1.desc" />
          </div>
          <div className={styles.heroPoint}>
            <strong>
              <FormattedMessage id="login.hero.point2.title" />
            </strong>
            <FormattedMessage id="login.hero.point2.desc" />
          </div>
          <div className={styles.heroPoint}>
            <strong>
              <FormattedMessage id="login.hero.point3.title" />
            </strong>
            <FormattedMessage id="login.hero.point3.desc" />
          </div>
        </div>
      </div>

      <div className={styles.loginPanel}>
        <LoginForm
          logo={false}
          title={false}
          subTitle={false}
          onFinish={handleFinish}
          submitter={{ searchConfig: { submitText: intl.formatMessage({ id: 'login.submit' }) } }}
        >
          <div className={styles.loginTitle}>
            <FormattedMessage id="login.title" />
          </div>
          <div className={styles.loginSubtitle}>
            <FormattedMessage id="login.subtitle" />
          </div>
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder={intl.formatMessage({ id: 'login.username.placeholder' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'login.username.required' }) }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder={intl.formatMessage({ id: 'login.password.placeholder' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'login.password.required' }) }]}
          />
          <div style={{ marginBottom: 20 }}>
            <ProFormCheckbox noStyle name="remember">
              <FormattedMessage id="login.remember" />
            </ProFormCheckbox>
          </div>
        </LoginForm>
        <div className={styles.loginFooter}>
          <SafetyOutlined /> <FormattedMessage id="login.footer" />
        </div>
      </div>
    </div>
  );
}
