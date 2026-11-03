import { useTheme } from '@/theme/ThemeProvider';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useModel } from '@umijs/max';
import { Card, Col, Row } from 'antd';
import { FileTextOutlined, NotificationOutlined, TeamOutlined, UploadOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import styles from './index.less';

const STATS: { key: string; icon: ReactNode; color: string }[] = [
  { key: 'dashboard.stat.users', icon: <TeamOutlined />, color: '#1677ff' },
  { key: 'dashboard.stat.feedback', icon: <FileTextOutlined />, color: '#722ed1' },
  { key: 'dashboard.stat.ota', icon: <UploadOutlined />, color: '#13c2c2' },
  { key: 'dashboard.stat.announcement', icon: <NotificationOutlined />, color: '#fa8c16' },
];

export default function DashboardPage() {
  const intl = useIntl();
  const { initialState } = useModel('@@initialState');
  const { colorPrimary } = useTheme();
  const name = initialState?.name ?? '';

  return (
    <PageContainer content={intl.formatMessage({ id: 'dashboard.desc' })}>
      <div className={styles.welcomeBanner} style={{ ['--md-brand' as any]: colorPrimary }}>
        <h2 className={styles.welcomeTitle}>
          {intl.formatMessage({ id: 'dashboard.welcome' }, { name })}
        </h2>
        <p className={styles.welcomeDesc}>
          <FormattedMessage id="dashboard.desc" />
        </p>
      </div>

      <Row gutter={16} style={{ marginTop: 16 }}>
        {STATS.map((stat) => (
          <Col key={stat.key} xs={24} sm={12} lg={6}>
            <Card className={styles.dashboardStat} style={{ marginBottom: 16 }}>
              <div className={styles.statTitle}>{intl.formatMessage({ id: stat.key })}</div>
              <div className={styles.statValue}>--</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ color: stat.color, fontSize: 20 }}>{stat.icon}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
                  <FormattedMessage id="dashboard.stat.tip" />
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className={styles.placeholderCard} bordered>
        <FormattedMessage id="dashboard.placeholder" />
      </Card>
    </PageContainer>
  );
}
