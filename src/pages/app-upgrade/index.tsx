import FileUpload from '@/components/FileUpload';
import type {
  GetAppUpgradeAllReq,
  GetAppUpgradeAllRes,
  PostAppUpgradeReq,
} from '@/services/modules/app-upgrade';
import {
  AppPlatform,
  AppRegion,
  deleteAppUpgrade,
  getAppUpgradeAll,
  patchAppUpgrade,
  postAppUpgrade,
} from '@/services/modules/app-upgrade';
import { listToTable, renderFileLink, renderIndex } from '@/utils/table';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { DrawerForm, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { Button, Form, Grid, Input, message, Popconfirm, Space, Switch } from 'antd';
import { useRef, useState } from 'react';
import { Md5ArrayBuffer } from './md5';

/** 计算文件的 MD5 哈希值（增量分块计算，支持大文件） */
function computeFileMd5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024; // 每次读取 2MB
    const spark = new Md5ArrayBuffer();
    const reader = new FileReader();
    let currentChunk = 0;
    const chunks = Math.ceil(file.size / chunkSize);

    reader.onload = (e) => {
      if (e.target?.result) {
        spark.append(e.target.result as ArrayBuffer);
      }
      currentChunk++;
      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };
    reader.onerror = () => reject(reader.error);

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      reader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
  });
}

const platformOptions = [
  { label: 'Windows', value: AppPlatform.WINDOWS },
  { label: 'macOS', value: AppPlatform.MAC },
  { label: 'Android', value: AppPlatform.ANDROID },
];

const regionOptions = [
  { label: '国内', value: AppRegion.DOMESTIC },
  { label: '海外', value: AppRegion.OVERSEAS },
];

interface UpgradeFormData extends Omit<PostAppUpgradeReq, 'downloadUrl'> {
  downloadUrl: string[];
}

const EditUpgrade = ({ data, reload }: { data?: GetAppUpgradeAllRes; reload?: () => void }) => {
  const [form] = Form.useForm<UpgradeFormData>();
  const [uploading, setUploading] = useState(false);
  const [displayFileSize, setDisplayFileSize] = useState<string | number>();
  const [displayFileMd5, setDisplayFileMd5] = useState<string>();
  const { md } = Grid.useBreakpoint();
  const drawerWidth = md ? 560 : '100%';

  const submitService = (action: Promise<unknown>) =>
    action.then(() => {
      message.success('操作成功');
      reload?.();
      return true;
    });

  /** 文件上传成功后自动计算 MD5 和 fileSize */
  const handleFileChange = async (file: File, _key: string) => {
    setUploading(true);
    try {
      // fileSize 直接从 File 对象获取
      form.setFieldsValue({ fileSize: file.size });
      setDisplayFileSize(file.size);
      // 计算 MD5
      const md5 = await computeFileMd5(file);
      form.setFieldsValue({ fileMd5: md5 });
      setDisplayFileMd5(md5);
    } catch (e) {
      message.warning('MD5 计算失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DrawerForm<UpgradeFormData>
      form={form}
      layout="vertical"
      title={data ? '编辑应用更新' : '新建应用更新'}
      trigger={
        <Button type="primary" icon={data ? <EditOutlined /> : <PlusOutlined />}>
          {data ? '编辑' : '新建'}
        </Button>
      }
      drawerProps={{ width: drawerWidth, maskClosable: false, getContainer: undefined }}
      initialValues={{
        platform: AppPlatform.WINDOWS,
        region: AppRegion.DOMESTIC,
        status: 1,
        forceUpdate: 0,
      }}
      onOpenChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({
            ...data,
            downloadUrl: data.downloadUrl ? [data.downloadUrl] : [],
          });
          setDisplayFileSize(data.fileSize);
          setDisplayFileMd5(data.fileMd5);
        }
        if (!visible) {
          form.resetFields();
          setDisplayFileSize(undefined);
          setDisplayFileMd5(undefined);
        }
      }}
      onFinish={(values) => {
        const payload: PostAppUpgradeReq = {
          ...values,
          downloadUrl: values.downloadUrl?.[0],
          fileSize: values.fileSize ? Number(values.fileSize) : undefined,
        };
        const request = data ? patchAppUpgrade(payload, data.uuid) : postAppUpgrade(payload);
        return submitService(request).catch(() => false);
      }}
    >
      <ProFormText name="version" label="版本号" rules={[{ required: true, message: '请输入' }]} />
      <ProFormSelect
        name="platform"
        label="平台"
        options={platformOptions}
        rules={[{ required: true, message: '请选择' }]}
      />
      <ProFormSelect name="region" label="地区" options={regionOptions} />
      <ProFormSelect
        name="status"
        label="状态"
        options={[
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ]}
      />
      <ProFormSelect
        name="forceUpdate"
        label="是否强制更新"
        options={[
          { label: '否', value: 0 },
          { label: '是', value: 1 },
        ]}
      />
      <Form.Item
        name="downloadUrl"
        label="安装包"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload
          fileGroup="app-upgrade-package"
          ext={['.exe', '.dmg', '.pkg', '.apk']}
          onFileChange={handleFileChange}
        />
      </Form.Item>
      <Form.Item label="文件大小（字节）" tooltip="上传文件后自动计算">
        <Form.Item name="fileSize" noStyle>
          <Input type="hidden" />
        </Form.Item>
        <span className="ant-form-text">{displayFileSize != null ? displayFileSize : '-'}</span>
      </Form.Item>
      <Form.Item label="文件 MD5" tooltip="上传文件后自动计算">
        <Form.Item name="fileMd5" noStyle>
          <Input type="hidden" />
        </Form.Item>
        <span className="ant-form-text">{displayFileMd5 || '-'}</span>
      </Form.Item>
      <ProFormTextArea
        name="releaseNotes"
        label="更新说明"
        fieldProps={{ autoSize: { minRows: 3 }, maxLength: 2000, showCount: true }}
      />
      <ProFormTextArea
        name="releaseNotes_enUS"
        label="更新说明（英文）"
        fieldProps={{ autoSize: { minRows: 3 }, maxLength: 2000, showCount: true }}
      />
      <ProFormTextArea
        name="releaseNotes_jaJP"
        label="更新说明（日文）"
        fieldProps={{ autoSize: { minRows: 3 }, maxLength: 2000, showCount: true }}
      />
      <ProFormTextArea
        name="releaseNotes_koKR"
        label="更新说明（韩文）"
        fieldProps={{ autoSize: { minRows: 3 }, maxLength: 2000, showCount: true }}
      />
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const { md } = Grid.useBreakpoint();

  const handlePatch = (opt: Partial<PostAppUpgradeReq>, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchAppUpgrade(opt, uuid)
      .then(() => {
        message.success('操作成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setPatchLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteAppUpgrade(uuid)
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
      <ProTable<GetAppUpgradeAllRes, GetAppUpgradeAllReq>
        actionRef={actionRef}
        rowKey="uuid"
        columnsState={{
          defaultValue: {
            createTime: { show: false },
            updateTime: { show: false },
          },
        }}
        pagination={false}
        search={{
          optionRender: (searchConfig) => [
            <Button
              key="reset"
              icon={<ReloadOutlined />}
              onClick={() => searchConfig?.form?.resetFields?.()}
            >
              重置
            </Button>,
            <Button
              key="submit"
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => searchConfig?.form?.submit?.()}
            >
              查询
            </Button>,
          ],
        }}
        toolBarRender={() => [<EditUpgrade key="add" reload={actionRef.current?.reload} />]}
        request={(params) =>
          getAppUpgradeAll({
            platform: params.platform,
            region: params.region,
            status: params.status,
          }).then(listToTable)
        }
        columns={[
          {
            align: 'center',
            title: '序号',
            key: 'index',
            search: false,
            width: md ? 80 : 60,
            render: renderIndex,
          },
          {
            align: 'center',
            title: '平台',
            dataIndex: 'platform',
            valueEnum: { windows: 'Windows', mac: 'macOS', android: 'Android' },
          },
          {
            align: 'center',
            title: '地区',
            dataIndex: 'region',
            valueEnum: { domestic: '国内', overseas: '海外' },
          },
          { align: 'left', title: '版本号', dataIndex: 'version', search: false },
          {
            align: 'center',
            title: '创建时间',
            dataIndex: 'createTime',
            width: 160,
            search: false,
            valueType: 'dateTime',
          },
          {
            align: 'center',
            title: '编辑时间',
            dataIndex: 'updateTime',
            width: 160,
            search: false,
            valueType: 'dateTime',
          },
          {
            align: 'center',
            title: '安装包',
            dataIndex: 'downloadUrl',
            search: false,
            render: (_, record) => renderFileLink(record.downloadUrl),
          },
          ...(md
            ? [
                {
                  align: 'center' as const,
                  title: '文件大小',
                  dataIndex: 'fileSize',
                  search: false,
                },
                {
                  align: 'center' as const,
                  title: 'check下载',
                  dataIndex: 'downloadCountByCheck',
                  search: false,
                },
                {
                  align: 'center' as const,
                  title: 'latest下载',
                  dataIndex: 'downloadCountByLatest',
                  search: false,
                },
              ]
            : []),
          {
            align: 'center',
            title: '强更',
            dataIndex: 'forceUpdate',
            search: false,
            render: (_, record) => (
              <Switch
                checked={record.forceUpdate === 1}
                loading={patchLoading[record.uuid]}
                onChange={() =>
                  handlePatch({ forceUpdate: record.forceUpdate === 1 ? 0 : 1 }, record.uuid)
                }
              />
            ),
          },
          {
            align: 'center',
            title: '状态',
            dataIndex: 'status',
            valueEnum: { 1: '启用', 0: '禁用' },
            render: (_, record) => (
              <Switch
                checked={record.status === 1}
                loading={patchLoading[record.uuid]}
                onChange={() => handlePatch({ status: record.status === 1 ? 0 : 1 }, record.uuid)}
              />
            ),
          },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: md ? 150 : 120,
            render: (_, record) => (
              <Space>
                <EditUpgrade data={record} reload={actionRef.current?.reload} />
                <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.uuid)}>
                  <Button danger icon={<DeleteOutlined />} loading={deleteLoading[record.uuid]}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        scroll={{ x: 'max-content' }}
      />
    </PageContainer>
  );
};
