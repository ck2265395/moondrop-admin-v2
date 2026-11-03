import { deleteProfilepics, getProfilepicsAll } from '@/services/modules/profilepics';
import { completeImgUrl } from '@/utils/utils';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Card, Col, Empty, Grid, Popconfirm, Row, Space, Spin, message } from 'antd';
import { useState } from 'react';
import Add from './component/Add';

export default () => {
  const { md } = Grid.useBreakpoint();
  const { data, loading, refresh } = useRequest(getProfilepicsAll);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteProfilepics(uuid)
      .then(() => {
        message.success('删除成功');
        refresh();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <style>{`
        .profilepic-card.ant-card-hoverable:hover {
          border-color: #d9d9d9;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
          transform: translateY(-2px);
        }
        .profilepic-card-action.ant-btn-link {
          opacity: 0.6;
          transition: opacity 0.2s, color 0.2s;
        }
        .profilepic-card-action.ant-btn-link:hover {
          opacity: 1;
        }
        .profilepic-card-action-danger.ant-btn-link:hover {
          color: #ff4d4f !important;
        }
      `}</style>
      <div style={{ marginBottom: 16 }}>
        <Add
          key="add"
          reload={refresh}
          trigger={
            <Button type="primary" icon={<PlusOutlined />}>
              新建
            </Button>
          }
        />
      </div>
      <Spin spinning={loading}>
        {data && data.length > 0 ? (
          <Row gutter={[16, 16]}>
            {data.map((item, index) => (
              <Col key={item.uuid} xs={12} sm={8} md={6} lg={4} xl={4}>
                <Card
                  hoverable
                  className="profilepic-card"
                  styles={{
                    body: { padding: 8 },
                  }}
                  style={{
                    border: '1px solid #e8e8e8',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s',
                  }}
                  cover={
                    <a
                      target="_blank"
                      href={completeImgUrl(item.img)}
                      rel="noreferrer"
                      style={{ display: 'block', aspectRatio: '1 / 1', overflow: 'hidden' }}
                    >
                      <img
                        src={completeImgUrl(item.img)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </a>
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minHeight: 40,
                      paddingTop: 6,
                      paddingBottom: 6,
                    }}
                  >
                    <span style={{ color: '#999', fontSize: 12 }}>#{index + 1}</span>
                    <Space size="small">
                      <Add
                        reload={refresh}
                        data={item}
                        trigger={
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            className="profilepic-card-action"
                          >
                            {md ? '编辑' : ''}
                          </Button>
                        }
                      />
                      <Popconfirm
                        title="确定删除吗?"
                        okButtonProps={{ loading: deleteLoading[item.uuid] }}
                        onConfirm={() => {
                          handleDelete(item.uuid);
                        }}
                      >
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          className="profilepic-card-action profilepic-card-action-danger"
                          loading={deleteLoading[item.uuid]}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          !loading && <Empty description="暂无数据" />
        )}
      </Spin>
    </PageContainer>
  );
};
