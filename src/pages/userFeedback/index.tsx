import { BarChartOutlined, TableOutlined } from '@ant-design/icons';
// import { TagsOutlined } from '@ant-design/icons'; // 自动打标按钮注释
import { PageContainer } from '@ant-design/pro-components';
import { Button, Tooltip, Typography } from 'antd';
import { useState } from 'react';

import { PageContext } from './context/PageContext';
import usePage from './hooks/usePage';

import AutoTagModal from './components/AutoTagModal';
import Charts from './components/Charts/Index';
import Search from './components/Search';
import Table from './components/Table';
// import EditModal from './components/EditModal';

export default function Page() {
  const page = usePage();
  const [viewMode, setViewMode] = useState<boolean>(true);
  return (
    <PageContext.Provider value={page}>
      <PageContainer>
        <Search />

        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '16px 0',
            }}
          >
            <Typography.Title level={4} style={{ margin: 0 }}>
              {viewMode ? <>反馈数据({page?.pagination?.total || 0})</> : '数据分析'}
            </Typography.Title>
            <Tooltip title={viewMode ? '数据分析' : '数据表'}>
              <Button
                size="small"
                type={viewMode ? 'default' : 'primary'}
                icon={viewMode ? <BarChartOutlined /> : <TableOutlined />}
                onClick={() => setViewMode((prev) => !prev)}
              >
                {viewMode ? '数据分析' : '数据表'}
              </Button>
            </Tooltip>
            {/* <Tooltip title="扫描 problem_type 为空或为 other 的历史数据，按 content 关键词自动预测类型">
              <Button
                size="small"
                icon={<TagsOutlined />}
                onClick={() => page.setAutoTagVisible(true)}
              >
                自动打标
              </Button>
            </Tooltip> */}
          </div>
          <>{viewMode ? <Table /> : <Charts />}</>
        </>
      </PageContainer>

      <AutoTagModal
        visible={page.autoTagVisible}
        onCancel={() => page.setAutoTagVisible(false)}
        onSuccess={() => page.setReloadVersion((v) => v + 1)}
      />
    </PageContext.Provider>
  );
}
