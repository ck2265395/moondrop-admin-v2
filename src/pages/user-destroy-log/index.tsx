import type {
  GetUserDestroyLogReq,
  GetUserDestroyLogRes,
} from '@/services/modules/user-destroy-log'
import { getUserDestroyLogs } from '@/services/modules/user-destroy-log'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Tag } from 'antd'

const CHANNEL_ENUM: Record<string, { text: string; color: string }> = {
  account: { text: 'User', color: 'blue' },
  'account-global': { text: 'Account', color: 'geekblue' },
  admin: { text: '后台删除', color: 'red' },
}

/** 注销渠道展示：未知渠道原样显示 */
const channelText = (channel: string): string => CHANNEL_ENUM[channel]?.text ?? channel

/** 注销 IP 展示：括号补充归属地（国家 省 市 运营商） */
const renderDestroyIp = (ip: string, region: string): string => {
  const regionText = (region ?? '').split('|').filter(Boolean).join(' ')
  return regionText ? `${ip}（${regionText}）` : ip
}

export default () => {
  return (
    <PageContainer title="用户注销记录">
      <ProTable<GetUserDestroyLogRes, GetUserDestroyLogReq>
        rowKey="uuid"
        pagination={{
          showSizeChanger: true,
          defaultPageSize: 20,
          showTotal: (total: number, [start, end]: [number, number]) =>
            `第 ${start}-${end} 条/总共 ${total} 条`,
        }}
        request={(params) => {
          const { current, pageSize, username, email, phone, channel } = params
          return getUserDestroyLogs({
            pageSize,
            pageIndex: current,
            username,
            email,
            phone,
            channel,
          }).then((res) => ({
            success: true,
            data: res.list,
            total: res.total,
          }))
        }}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '用户名',
            dataIndex: 'username',
            width: 140,
          },
          {
            align: 'center',
            title: '昵称',
            dataIndex: 'nickname',
            width: 140,
          },
          {
            align: 'center',
            title: '邮箱',
            dataIndex: 'email',
            width: 220,
          },
          {
            align: 'center',
            title: '手机号',
            dataIndex: 'phone',
            width: 140,
          },
          {
            align: 'center',
            title: '注销渠道',
            dataIndex: 'channel',
            width: 110,
            valueEnum: Object.fromEntries(
              Object.entries(CHANNEL_ENUM).map(([key, value]) => [key, { text: value.text }]),
            ),
            render: (_, record) => (
              <Tag color={CHANNEL_ENUM[record.channel]?.color ?? 'default'}>
                {channelText(record.channel)}
              </Tag>
            ),
          },
          {
            align: 'center',
            title: '注销IP',
            dataIndex: 'destroyIp',
            width: 260,
            search: false,
            render: (_, record) => renderDestroyIp(record.destroyIp, record.region),
          },
          {
            align: 'center',
            title: '注销时间',
            dataIndex: 'createTime',
            valueType: 'dateTime',
            width: 165,
            search: false,
          },
          {
            title: '用户UUID',
            dataIndex: 'userUuid',
            width: 300,
            search: false,
          },
        ]}
      />
    </PageContainer>
  )
}
