import FileUpload from '@/components/FileUpload';
import UuidCell from '@/components/UuidCell';
import { getIconAll } from '@/services/modules/icon';
import type {
  GetWhiteNoiseAudioReq,
  GetWhiteNoiseAudioRes,
  PostWhiteNoiseAudioReq,
} from '@/services/modules/white-noise-audio';
import {
  deleteWhiteNoiseAudio,
  getWhiteNoiseAudioIndex,
  patchWhiteNoiseAudio,
  postWhiteNoiseAudio,
  WhiteNoiseAudioType,
} from '@/services/modules/white-noise-audio';
import {
  pageToTable,
  renderFileDownload,
  renderIndex,
  renderThumb,
  tablePagination,
} from '@/utils/table';
import {
  DrawerForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Popconfirm, Space, Switch, Tag } from 'antd';
import { useRef, useState } from 'react';

const typeOptions = [
  { label: '素材', value: WhiteNoiseAudioType.MATERIAL },
  { label: '官方混音', value: WhiteNoiseAudioType.OFFICIAL },
  { label: '用户混音', value: WhiteNoiseAudioType.USER },
];

interface AudioFormData extends Omit<PostWhiteNoiseAudioReq, 'file' | 'pic'> {
  file: string[];
  pic?: string[];
}

const EditAudio = ({ data, reload }: { data?: GetWhiteNoiseAudioRes; reload?: () => void }) => {
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<AudioFormData>();
  const { data: iconOptions } = useRequest(async () => {
    const res = await getIconAll();
    return res.map((item) => ({ label: item.name, value: item.uuid }));
  });
  const { runAsync: postRun } = useRequest(postWhiteNoiseAudio, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });
  const { runAsync: patchRun } = useRequest(patchWhiteNoiseAudio, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      title={data ? '编辑白噪音' : '新建白噪音'}
      trigger={<Button type="primary">{data ? '编辑' : '新建'}</Button>}
      drawerProps={{ width: md ? 520 : '100%', maskClosable: false, getContainer: undefined }}
      initialValues={{
        status: 1,
        type: WhiteNoiseAudioType.MATERIAL,
        titleEnUS: '',
        titleJaJP: '',
        titleKoKR: '',
        descEnUS: '',
        descJaJP: '',
        descKoKR: '',
      }}
      onVisibleChange={(visible) => {
        if (visible && data) {
          form.setFieldsValue({
            title: data.title,
            titleEnUS: data.titleEnUS,
            titleJaJP: data.titleJaJP,
            titleKoKR: data.titleKoKR,
            desc: data.desc,
            descEnUS: data.descEnUS,
            descJaJP: data.descJaJP,
            descKoKR: data.descKoKR,
            mixinfo: data.mixinfo,
            file: data.file ? [data.file] : [],
            pic: data.pic ? [data.pic] : [],
            type: data.type,
            tags: data.tags,
            iconUuid: data.iconUuid,
            status: data.status,
          });
        }
        if (!visible) {
          form.resetFields();
        }
      }}
      onFinish={(values) => {
        const payload = {
          ...values,
          file: values.file?.[0],
          pic: values.pic?.[0],
          tags: values.tags ?? [],
        } as PostWhiteNoiseAudioReq;
        const request = data ? patchRun(payload, data.uuid) : postRun(payload);
        return request.then(() => true).catch(() => false);
      }}
    >
      <ProFormText
        name="title"
        label="标题（中）"
        rules={[{ required: true, message: '请输入' }]}
      />
      <ProFormText name="titleEnUS" label="标题（英）" fieldProps={{ placeholder: '可选' }} />
      <ProFormText name="titleJaJP" label="标题（日）" fieldProps={{ placeholder: '可选' }} />
      <ProFormText name="titleKoKR" label="标题（韩）" fieldProps={{ placeholder: '可选' }} />
      <ProFormSelect
        name="type"
        label="类型"
        options={typeOptions}
        rules={[{ required: true, message: '请选择' }]}
      />
      <ProFormSelect
        name="status"
        label="状态"
        options={[
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ]}
      />
      <ProFormSelect name="iconUuid" label="图标" allowClear options={iconOptions} />
      <ProFormSelect
        name="tags"
        label="标签"
        fieldProps={{ mode: 'tags', tokenSeparators: [',', '，'] }}
      />
      <Form.Item
        name="file"
        label="音频文件"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="white-noise-audio" ext={['.flac', '.m4a', '.mp3', '.aac', '.wav']} />
      </Form.Item>
      <Form.Item name="pic" label="混音图片">
        <FileUpload
          fileGroup="white-noise-audio-pic"
          ext={['.jpg', '.jpeg', '.png', '.webp', '.gif']}
        />
      </Form.Item>
      <ProFormTextArea
        name="desc"
        label="描述（中）"
        fieldProps={{ autoSize: { minRows: 3 }, showCount: true, maxLength: 2000 }}
      />
      <ProFormTextArea
        name="descEnUS"
        label="描述（英）"
        fieldProps={{
          autoSize: { minRows: 2 },
          showCount: true,
          maxLength: 2000,
          placeholder: '可选',
        }}
      />
      <ProFormTextArea
        name="descJaJP"
        label="描述（日）"
        fieldProps={{
          autoSize: { minRows: 2 },
          showCount: true,
          maxLength: 2000,
          placeholder: '可选',
        }}
      />
      <ProFormTextArea
        name="descKoKR"
        label="描述（韩）"
        fieldProps={{
          autoSize: { minRows: 2 },
          showCount: true,
          maxLength: 2000,
          placeholder: '可选',
        }}
      />
      <ProFormTextArea
        name="mixinfo"
        label="混音信息"
        fieldProps={{ autoSize: { minRows: 3 }, showCount: true, maxLength: 5000 }}
      />
    </DrawerForm>
  );
};

export default () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const [patchLoading, setPatchLoading] = useState<Record<string, boolean>>({});
  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteWhiteNoiseAudio(uuid)
      .then(() => {
        message.success('删除成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };
  const handlePatch = (status: 0 | 1, uuid: string) => {
    setPatchLoading((prev) => ({ ...prev, [uuid]: true }));
    patchWhiteNoiseAudio({ status }, uuid)
      .then(() => {
        message.success('操作成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setPatchLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  return (
    <PageContainer>
      <ProTable<GetWhiteNoiseAudioRes, GetWhiteNoiseAudioReq>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={tablePagination}
        toolBarRender={() => [<EditAudio key="add" reload={actionRef.current?.reload} />]}
        request={(params) =>
          getWhiteNoiseAudioIndex({
            pageIndex: params.current,
            pageSize: params.pageSize,
            title: params.title,
            type: params.type,
            status: params.status,
          }).then(pageToTable)
        }
        scroll={{ x: 'max-content' }}
        columns={[
          {
            align: 'center',
            title: '序号',
            key: 'index',
            width: 80,
            search: false,
            render: renderIndex,
          },
          {
            align: 'center',
            title: 'UUID',
            key: 'uuid',
            search: false,
            width: 220,
            render: (_, record) => <UuidCell uuid={record.uuid} />,
          },
          { align: 'left', title: '标题', dataIndex: 'title' },
          {
            align: 'center',
            title: '类型',
            dataIndex: 'type',
            valueEnum: { material: '素材', official: '官方混音', user: '用户混音' },
          },
          {
            align: 'center',
            title: '图片',
            dataIndex: 'pic',
            search: false,
            render: (_, record) => renderThumb(record.pic, 56),
          },
          {
            align: 'center',
            title: '音频',
            dataIndex: 'file',
            search: false,
            render: (_, record) => renderFileDownload(record.file),
          },
          {
            align: 'center',
            title: '标签',
            dataIndex: 'tags',
            search: false,
            render: (_, record) => record.tags?.map((tag) => <Tag key={tag}>{tag}</Tag>),
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
                onChange={() => handlePatch(record.status === 1 ? 0 : 1, record.uuid)}
              />
            ),
          },
          {
            align: 'center',
            title: '操作',
            valueType: 'option',
            width: 150,
            render: (_, record) => (
              <Space>
                <EditAudio data={record} reload={actionRef.current?.reload} />
                <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.uuid)}>
                  <Button danger type="primary" loading={deleteLoading[record.uuid]}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};
