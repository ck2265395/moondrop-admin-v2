import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage } from '@umijs/max';
import { Card, Typography } from 'antd';

// 功能迁移期的页面占位组件，替换为真实功能时删除该引用即可
export default function PagePlaceholder() {
  return (
    <PageContainer>
      <Card>
        <Typography.Text type="secondary">
          <FormattedMessage id="page.placeholder" />
        </Typography.Text>
      </Card>
    </PageContainer>
  );
}
