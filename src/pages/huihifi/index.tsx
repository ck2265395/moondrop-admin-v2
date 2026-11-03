import {
  getHuiHifiEvaluations,
  getHuiHifiStatus,
  postHuiHifiCacheInvalidate,
} from '@/services/modules/huihifi';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Alert, Button, Card, message, Space } from 'antd';

export default () => {
  const { data: status, refresh } = useRequest(getHuiHifiStatus);
  const { run: invalidate, loading } = useRequest(postHuiHifiCacheInvalidate, {
    manual: true,
    onSuccess: (res) => {
      message.success(`已清理 ${res.removed ?? 0} 条缓存`);
      refresh();
    },
  });

  return (
    <PageContainer>
      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <Space>
          <Alert
            type={status?.enabled ? 'success' : 'warning'}
            showIcon
            message={status?.enabled ? 'HuiHiFi 已启用' : 'HuiHiFi 未启用'}
          />
          <Button loading={loading} onClick={() => invalidate()}>
            清理缓存
          </Button>
        </Space>
      </Card>
      <ProTable<any, { keyword?: string; category?: 'EARBUDS' | 'SOUND_SOURCE' }>
        rowKey={(record) => record.uuid || record.id || record.title}
        pagination={false}
        request={(params) =>
          getHuiHifiEvaluations({
            keyword: params.keyword,
            category: params.category,
            pageSize: 20,
          }).then((res) => ({
            success: true,
            data: res.items ?? [],
            total: res.total,
          }))
        }
        scroll={{ x: 'max-content' }}
        columns={[
          { align: 'center', title: '关键词', dataIndex: 'keyword', hideInTable: true },
          {
            align: 'center',
            title: '分类',
            dataIndex: 'category',
            hideInTable: true,
            valueEnum: { EARBUDS: '耳机', SOUND_SOURCE: '音源' },
          },
          { align: 'center', title: '标题', dataIndex: 'title', search: false },
          { align: 'center', title: '品牌', dataIndex: ['brand', 'name'], search: false },
          { align: 'center', title: 'UUID', dataIndex: 'uuid', search: false },
        ]}
      />
    </PageContainer>
  );
};
