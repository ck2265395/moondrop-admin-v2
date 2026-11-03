import { Card, Typography } from 'antd';
import { useIntl, FormattedMessage } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';

export default function HomePage() {
  const intl = useIntl();

  return (
    <PageContainer content={intl.formatMessage({ id: 'home.desc' })}>
      <Card title={intl.formatMessage({ id: 'home.i18n.title' })} style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          <FormattedMessage id="home.i18n.desc" />
        </Typography.Text>
      </Card>
      <Card title={intl.formatMessage({ id: 'home.theme.title' })}>
        <Typography.Text type="secondary">
          <FormattedMessage id="home.theme.desc" />
        </Typography.Text>
      </Card>
    </PageContainer>
  );
}
