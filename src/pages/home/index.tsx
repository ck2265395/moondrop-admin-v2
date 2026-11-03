import { PageContainer } from '@ant-design/pro-components';
import { Card, Typography } from 'antd';

export default function HomePage() {
  return (
    <PageContainer>
      <Card>
        <Typography.Title level={4}>Moondrop Admin V2</Typography.Title>
        <Typography.Text type="secondary">
          UmiJS Max 4 + antd 5 + Pro Components 2 脚手架已就绪。antd 5
          支持运行时主题（theme.darkAlgorithm 可直接做暗色模式）。
        </Typography.Text>
      </Card>
    </PageContainer>
  );
}
