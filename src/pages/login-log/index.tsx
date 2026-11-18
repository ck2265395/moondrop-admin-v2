import type { GetLoginLogReq, GetLoginLogRes } from '@/services/modules/login-log';
import { getLoginLogs } from '@/services/modules/login-log';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';

const LOGIN_TYPE_ENUM = {
  password: { text: '密码' },
  casdoor: { text: 'Casdoor' },
};

export default () => {
  return (
    <PageContainer title="登录日志">
      <ProTable<GetLoginLogRes, GetLoginLogReq>
        rowKey="uuid"
        pagination={{
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total: number, [start, end]: [number, number]) =>
            `第 ${start}-${end} 条/总共 ${total} 条`,
        }}
        request={(params) => {
          const { current, pageSize, username, startTime, endTime } = params;
          return getLoginLogs({
            pageSize,
            pageIndex: current,
            username,
            startTime,
            endTime,
          }).then((res) => ({
            success: true,
            data: res.list,
            total: res.total,
          }));
        }}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '用户名',
            dataIndex: 'username',
            width: 280,
            order: 100,
            render: (_, record) =>
              record.adminName ? `${record.username}(${record.adminName})` : record.username,
          },
          {
            align: 'center',
            title: '登录方式',
            dataIndex: 'loginType',
            width: 110,
            search: false,
            render: (_, record) => (
              <Tag color={record.loginType === 'casdoor' ? 'blue' : 'default'}>
                {LOGIN_TYPE_ENUM[record.loginType]?.text ?? record.loginType}
              </Tag>
            ),
          },
          {
            align: 'center',
            title: 'IP',
            dataIndex: 'ip',
            width: 200,
            search: false,
            render: (_, record) => {
              if (!record.ip) return '';
              const regionText = (record.region ?? '').split('|').filter(Boolean).join(' ');
              return (
                <div style={{ lineHeight: 1.5 }}>
                  <div>{record.ip}</div>
                  {regionText && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{regionText}</div>}
                </div>
              );
            },
          },
          {
            align: 'center',
            title: '时间',
            dataIndex: 'createTime',
            valueType: 'dateTime',
            width: 165,
            search: false,
          },
          {
            title: '时间范围',
            dataIndex: 'createTimeRange',
            hideInTable: true,
            valueType: 'dateTimeRange' as const,
            search: {
              transform: (value: unknown) => {
                const arr = value as { valueOf: () => number }[] | undefined;
                return {
                  startTime: arr?.[0]?.valueOf(),
                  endTime: arr?.[1]?.valueOf(),
                };
              },
            },
          },
        ]}
      />
    </PageContainer>
  );
};
