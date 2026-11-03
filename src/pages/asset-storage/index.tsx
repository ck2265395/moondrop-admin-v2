import FileUpload from '@/components/FileUpload';
import type {
  GetAssetStorageReq,
  GetAssetStorageRes,
  PatchAssetStorageReq,
  PostAssetStorageReq,
} from '@/services/modules/asset-storage';
import {
  deleteAssetStorage,
  getAssetStorageIndex,
  patchAssetStorage,
  postAssetStorage,
} from '@/services/modules/asset-storage';
import { pageToTable, renderFileLink, renderIndex, tablePagination } from '@/utils/table';
import { completeImgUrl } from '@/utils/utils';
import {
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import {
  DrawerForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space, Tooltip, Typography } from 'antd';
import { useRef, useState } from 'react';

const ASSET_STORAGE_GROUP = 'asset-storage';

interface AssetStorageFormData extends Omit<PostAssetStorageReq, 'fileKey' | 'fileSize'> {
  file: string[];
  fileSize?: string;
}

// 按后缀返回对应图标；图片类型返回缩略图
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.heic', '.bmp', '.ico'];
const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
const AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'];
const ZIP_EXTS = ['.zip', '.rar', '.7z', '.gz', '.tar'];
const CODE_EXTS = ['.json', '.xml', '.yaml', '.yml', '.csv', '.txt', '.log'];

function getExt(fileNameOrKey: string): string {
  const name = fileNameOrKey || '';
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return name.slice(dot).toLowerCase();
}

function renderAssetThumb(fileKey?: string, size = 48) {
  if (!fileKey) return '--';
  const ext = getExt(fileKey);

  if (IMAGE_EXTS.includes(ext)) {
    return (
      <img
        src={completeImgUrl(fileKey)}
        width={size}
        height={size}
        style={{ objectFit: 'cover', borderRadius: 4 }}
      />
    );
  }
  if (VIDEO_EXTS.includes(ext))
    return <FileImageOutlined style={{ fontSize: size, color: '#1677ff' }} />;
  if (AUDIO_EXTS.includes(ext))
    return <FileImageOutlined style={{ fontSize: size, color: '#722ed1' }} />;
  if (ZIP_EXTS.includes(ext))
    return <FileZipOutlined style={{ fontSize: size, color: '#fa8c16' }} />;
  if (CODE_EXTS.includes(ext))
    return <FileTextOutlined style={{ fontSize: size, color: '#13c2c2' }} />;
  if (ext === '.pdf') return <FilePdfOutlined style={{ fontSize: size, color: '#f5222d' }} />;
  if (ext === '.xlsx' || ext === '.xls' || ext === '.csv')
    return <FileExcelOutlined style={{ fontSize: size, color: '#52c41a' }} />;
  if (ext === '.doc' || ext === '.docx')
    return <FileTextOutlined style={{ fontSize: size, color: '#1677ff' }} />;
  if (
    ext === '.bin' ||
    ext === '.fot' ||
    ext === '.ufw' ||
    ext === '.hid' ||
    ext === '.apk' ||
    ext === '.exe' ||
    ext === '.pkg' ||
    ext === '.dmg'
  ) {
    return <FileOutlined style={{ fontSize: size, color: '#8c8c8c' }} />;
  }
  return <FileUnknownOutlined style={{ fontSize: size, color: '#8c8c8c' }} />;
}

const KEY_PATTERN = /^[A-Za-z0-9_\-\/\.]+$/;

const EditAssetStorage = ({ data, reload }: { data?: GetAssetStorageRes; reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<AssetStorageFormData>();
  const { runAsync: postRun } = useRequest(postAssetStorage, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchAssetStorage, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });

  // 编辑模式下，key 一旦确定即不允许修改（业务代码以固定 key 引用文件，改 key 会导致引用失效）
  const isEdit = !!data;

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title={isEdit ? '编辑文件存储' : '新建文件存储'}
      trigger={
        !isEdit ? <Button type="primary">新建</Button> : <Button type="primary">编辑</Button>
      }
      drawerProps={{
        width: md ? 480 : '100%',
        maskClosable: false,
        getContainer: undefined,
      }}
      onOpenChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({
            key: data.key,
            description: data.description,
            file: data.fileKey ? [data.fileKey] : [],
          });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const fileKey = values.file?.[0];
        if (!fileKey) {
          message.warning('请上传文件');
          return Promise.resolve(false);
        }
        if (isEdit) {
          const payload: PatchAssetStorageReq = {
            description: values.description ?? '',
            fileKey,
          };
          return patchRun(payload, data!.uuid)
            .then(() => true)
            .catch(() => false);
        }
        const payload: PostAssetStorageReq = {
          key: values.key,
          description: values.description ?? '',
          fileKey,
        };
        return postRun(payload)
          .then(() => true)
          .catch(() => false);
      }}
    >
      <ProFormText
        name="key"
        label="Key"
        placeholder="如：official-profilepic"
        disabled={isEdit}
        rules={[
          { required: true, message: '请输入 key' },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              if (!KEY_PATTERN.test(value)) {
                return Promise.reject(
                  new Error('只能包含英文字母、数字、下划线、连字符、斜杠、点'),
                );
              }
              return Promise.resolve();
            },
          },
        ]}
        extra={
          isEdit ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Key 不可修改（业务侧按固定 key 引用）
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              业务侧通过此 key 获取文件，新建后不可修改
            </Typography.Text>
          )
        }
      />
      <ProFormTextArea
        name="description"
        label="描述"
        placeholder="简短描述这个文件用途"
        fieldProps={{ maxLength: 500, showCount: true, autoSize: { minRows: 2 } }}
      />
      <Form.Item
        name="file"
        label="文件"
        rules={[{ required: true, type: 'array', message: '请上传文件' }]}
      >
        <FileUpload
          fileGroup={ASSET_STORAGE_GROUP}
          ext={['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.txt', '.json', '.bin']}
        />
      </Form.Item>
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteAssetStorage(uuid)
      .then(() => {
        message.success('删除成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <ProTable<GetAssetStorageRes, GetAssetStorageReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={tablePagination}
        toolBarRender={() => [
          <EditAssetStorage key="add" reload={() => actionRef.current?.reload()} />,
        ]}
        request={(params) =>
          getAssetStorageIndex({
            pageIndex: params.current,
            pageSize: params.pageSize,
            key: params.key,
            description: params.description,
          }).then(pageToTable)
        }
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '序号',
            key: 'index',
            search: false,
            width: 80,
            render: renderIndex,
          },
          {
            align: 'left',
            title: 'Key',
            dataIndex: 'key',
            copyable: true,
            width: 200,
          },
          {
            align: 'left',
            title: '描述',
            dataIndex: 'description',
            ellipsis: true,
            width: 200,
            render: (_, record) => record.description || '--',
          },
          {
            align: 'center',
            title: '预览',
            dataIndex: 'fileKey',
            search: false,
            width: 80,
            render: (_, record) => renderAssetThumb(record.fileKey, 48),
          },
          {
            align: 'left',
            title: '文件地址',
            dataIndex: 'fileKey',
            search: false,
            width: 260,
            render: (_, record) => renderFileLink(record.fileKey),
          },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: 200,
            render: (_, record) => (
              <Space>
                <EditAssetStorage data={record} reload={() => actionRef.current?.reload()} />
                {record.allowDel ? (
                  <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.uuid)}>
                    <Button danger type="primary" loading={deleteLoading[record.uuid]}>
                      删除
                    </Button>
                  </Popconfirm>
                ) : (
                  <Tooltip title="该文件不允许删除">
                    <Button danger type="primary" disabled>
                      删除
                    </Button>
                  </Tooltip>
                )}
              </Space>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};
