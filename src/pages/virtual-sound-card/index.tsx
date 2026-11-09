import EqConfigAdd from './component/EqConfigAdd';

import FileUpload from '@/components/FileUpload';
import UuidCell from '@/components/UuidCell';
import { getPeqConfigTagAdminAll, TagType } from '@/services/modules/peq-config-tag-admin';
import {
  getVscChannelAll,
  patchVscChannel,
  postVscChannel,
  type GetVscChannelRes,
  type PatchVscChannelReq,
  type PostVscChannelReq,
} from '@/services/modules/virtual-sound-card-channel';
import {
  deleteVscDrcPreset,
  getVscDrcPresetAll,
  patchVscDrcPreset,
  postVscDrcPreset,
  type GetVscDrcPresetRes,
  type PatchVscDrcPresetReq,
  type PostVscDrcPresetReq,
} from '@/services/modules/virtual-sound-card-drc-preset';
import {
  deleteVscEqConfig,
  getVscEqConfigAll,
  patchVscEqConfigStatus,
  type GetVscEqConfigRes,
} from '@/services/modules/virtual-sound-card-eq-config';
import { peqType } from '@/utils/data';
import { pageToTable, renderFileIcon, tablePagination } from '@/utils/table';
import { completeImgUrl, downloadFile } from '@/utils/utils';
import { PageContainer, ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useMemo, useRef, useState } from 'react';

const { Paragraph } = Typography;

/** Tab1：静态EQ配置 —— Add 组件独立 DrawerForm（参照 PEQ 配置文件） */
const ConfigTab = () => {
  const actionRef = useRef<ActionType>();
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});

  // 预加载通道列表（表格 valueEnum + render 用）
  const { data: channels = [] } = useRequest(async () => {
    const res = await getVscChannelAll({ pageIndex: 1, pageSize: 200 });
    return res.list;
  });

  const channelMap = useMemo(() => {
    const map: Record<string, string> = {};
    channels.forEach((c) => {
      map[c.uuid] = c.name;
    });
    return map;
  }, [channels]);

  const typeEnum = peqType.$list().reduce<Record<string, string>>((res, item) => {
    res[item.key] = item.value;
    return res;
  }, {});

  const handleDelete = (uuid: string) => {
    setDeleteLoading((prev) => ({ ...prev, [uuid]: true }));
    deleteVscEqConfig(uuid)
      .then(() => {
        message.success('删除成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  const handleStatus = (checked: boolean, uuid: string) => {
    setStatusLoading((prev) => ({ ...prev, [uuid]: true }));
    patchVscEqConfigStatus(checked ? 1 : 0, uuid)
      .then(() => {
        message.success('状态修改成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setStatusLoading((prev) => ({ ...prev, [uuid]: false }));
      });
  };

  const columns: ProColumns<GetVscEqConfigRes>[] = [
    { title: '序号', valueType: 'index', width: 60, search: false },
    {
      title: 'UUID',
      dataIndex: 'uuid',
      width: 220,
      search: false,
      render: (_, record) => <UuidCell uuid={record.uuid} />,
    },
    { title: '关键词', dataIndex: 'keyword', hideInTable: true },
    {
      title: '所属通道',
      dataIndex: 'channelUuid',
      width: 140,
      valueType: 'select',
      valueEnum: useMemo(() => {
        const enumMap: Record<string, { text: string }> = {};
        channels.forEach((c) => {
          enumMap[c.uuid] = { text: c.name };
        });
        return enumMap;
      }, [channels]),
      render: (_, record) => channelMap[record.channelUuid] ?? '-',
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 200,
      search: false,
      render: (_, record) => (
        <Paragraph
          ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
          style={{ marginBottom: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}
        >
          {record.title}
        </Paragraph>
      ),
    },
    {
      title: 'EQ 文件',
      dataIndex: 'file',
      width: 80,
      align: 'center',
      search: false,
      render: (_, record) => {
        const val = record.file;
        if (!val) return '--';
        return (
          <Tooltip title={`下载：${val}`}>
            <a onClick={() => downloadFile(completeImgUrl(val))}>{renderFileIcon(val, 24)}</a>
          </Tooltip>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: typeEnum,
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
      search: false,
      render: (_, record) =>
        record.source ? (
          <Tag style={{ margin: 0 }}>
            {record.source.charAt(0).toUpperCase() + record.source.slice(1)}
          </Tag>
        ) : null,
    },
    {
      title: '用户',
      dataIndex: 'userUuid',
      width: 130,
      search: {
        transform: (value) => ({ userUuid: value }),
      },
      render: (_, record) =>
        record.userUuid ? record.userNickname || record.userUsername || record.userUuid : '',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 200,
      search: false,
      render: (_dom, record) => {
        const tags = record.tags;
        if (!tags?.length) return '';
        return (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tags.map((t) => (
              <Tag
                key={t.uuid}
                color="default"
                style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                <img
                  src={completeImgUrl(t.icon)}
                  alt=""
                  style={{ width: 14, height: 14, objectFit: 'contain' }}
                />
                {t.title}
              </Tag>
            ))}
          </span>
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'desc',
      width: 180,
      search: false,
      render: (_, record) =>
        record.desc ? (
          <Paragraph
            ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
            style={{ marginBottom: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}
          >
            {record.desc}
          </Paragraph>
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      search: false,
      render: (_val, record) => (
        <Switch
          checkedChildren="上线"
          unCheckedChildren="下线"
          checked={record.status === 1}
          loading={statusLoading[record.uuid]}
          onChange={(checked) => handleStatus(checked, record.uuid)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '编辑时间',
      dataIndex: 'updateTime',
      width: 160,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_, record) => [
        <EqConfigAdd key="edit" reload={actionRef.current?.reload} data={record} />,
        <Popconfirm
          key="del"
          title="确定删除吗?"
          okButtonProps={{ loading: deleteLoading[record.uuid] }}
          onConfirm={() => handleDelete(record.uuid)}
        >
          <Button danger type="primary">
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ProTable<GetVscEqConfigRes>
      actionRef={actionRef}
      rowKey="uuid"
      columns={columns}
      pagination={tablePagination}
      scroll={{ x: 'max-content' }}
      columnsState={{
        defaultValue: {
          source: { show: false },
          updateTime: { show: false },
        },
      }}
      toolBarRender={() => [<EqConfigAdd key="add" reload={actionRef.current?.reload} />]}
      request={async (params) => {
        const res = await getVscEqConfigAll({
          keyword: params.keyword,
          channelUuid: params.channelUuid,
          userUuid: params.userUuid,
          type: params.type,
          status: params.status,
          pageIndex: params.current,
          pageSize: params.pageSize,
        });
        return pageToTable(res);
      }}
    />
  );
};

/** Tab2：动态 DRC 预设 —— 真实 CURD（后台） */
const DrcTab = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GetVscDrcPresetRes | null>(null);
  const [form] = Form.useForm<PostVscDrcPresetReq & { uuid?: string; files?: string[] }>();
  const [updateLoading, setUpdateLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const { data: gameTagIcons = [] } = useRequest(async () => {
    const res = await getPeqConfigTagAdminAll({ type: TagType.GAME });
    return res
      .filter((t) => t.status === 1 && t.icon)
      .map((t) => ({
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <img
              src={completeImgUrl(t.icon)}
              alt={t.title}
              style={{ width: 18, height: 18, objectFit: 'contain' }}
            />
            {t.title}
          </span>
        ),
        value: t.icon,
      }));
  });

  const { runAsync: createRun, loading: creating } = useRequest(postVscDrcPreset, {
    manual: true,
    onSuccess: () => {
      message.success('新增成功');
      setModalOpen(false);
      actionRef.current?.reload();
    },
  });

  const { runAsync: updateRun } = useRequest(patchVscDrcPreset, {
    manual: true,
    onSuccess: () => {
      message.success('修改成功');
      setModalOpen(false);
      actionRef.current?.reload();
    },
  });

  const handleUpdate = (opt: PatchVscDrcPresetReq, uuid: string) => {
    setUpdateLoading((prev) => ({ ...prev, [uuid]: true }));
    updateRun(opt, uuid).finally(() => {
      setUpdateLoading((prev) => ({ ...prev, [uuid]: false }));
    });
  };

  const handleDelete = (record: GetVscDrcPresetRes) => {
    setDeleteLoading((prev) => ({ ...prev, [record.uuid]: true }));
    deleteVscDrcPreset(record.uuid)
      .then(() => {
        message.success('删除成功');
        actionRef.current?.reload();
      })
      .finally(() => {
        setDeleteLoading((prev) => ({ ...prev, [record.uuid]: false }));
      });
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 0 });
    setModalOpen(true);
  };

  const openEdit = (record: GetVscDrcPresetRes) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      files: record.fileKey ? [record.fileKey] : [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const uuid = values.uuid;
    const files = values.files;
    delete values.uuid;
    delete values.files;
    if (files?.length) {
      values.fileKey = files[0];
    }
    if (uuid) {
      await handleUpdate(values, uuid);
    } else {
      await createRun(values);
    }
  };

  const columns: ProColumns<GetVscDrcPresetRes>[] = [
    { title: '序号', valueType: 'index', width: 70, search: false },
    {
      title: 'UUID',
      dataIndex: 'uuid',
      width: 220,
      search: false,
      render: (_, record) => <UuidCell uuid={record.uuid} />,
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 160,
      search: false,
    },
    {
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
    },
    {
      title: '用户',
      dataIndex: 'userUuid',
      width: 130,
      search: {
        transform: (value) => ({ userKeyword: value }),
      },
      render: (_, record) => record.userNickname || record.userUsername || '-',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 60,
      align: 'center',
      search: false,
      render: (_, record) =>
        record.icon ? (
          <img
            src={completeImgUrl(record.icon)}
            alt=""
            style={{ width: 24, height: 24, objectFit: 'contain' }}
          />
        ) : (
          '-'
        ),
    },
    {
      title: 'DRC 文件',
      dataIndex: 'fileKey',
      width: 80,
      align: 'center',
      search: false,
      render: (_, record) => {
        const val = record.fileKey;
        if (!val) return '--';
        return (
          <Tooltip title={`下载：${val}`}>
            <a onClick={() => downloadFile(completeImgUrl(val))}>{renderFileIcon(val, 24)}</a>
          </Tooltip>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      search: {
        transform: (value) => ({ status: value === '' ? undefined : Number(value) }),
      },
      valueType: 'select',
      valueEnum: { 0: { text: '下线' }, 1: { text: '上线' } },
      render: (_val, record) => (
        <Switch
          checkedChildren="上线"
          unCheckedChildren="下线"
          checked={record.status === 1}
          loading={updateLoading[record.uuid]}
          onChange={(checked) => handleUpdate({ status: checked ? 1 : 0 }, record.uuid)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '编辑时间',
      dataIndex: 'updateTime',
      width: 160,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 140,
      search: false,
      render: (_, record) => [
        <Button key="edit" type="primary" onClick={() => openEdit(record)}>
          编辑
        </Button>,
        <Button
          key="del"
          type="primary"
          danger
          onClick={() => {
            Modal.confirm({
              title: '确认删除？',
              content: `DRC 预设「${record.title}」将被永久删除`,
              okText: '删除',
              okType: 'danger',
              cancelText: '取消',
              onOk: () => handleDelete(record),
            });
          }}
        >
          删除
        </Button>,
      ],
    },
  ];

  return (
    <>
      <ProTable<GetVscDrcPresetRes>
        actionRef={actionRef}
        rowKey="uuid"
        columns={columns}
        pagination={tablePagination}
        columnsState={{
          defaultValue: {
            updateTime: { show: false },
          },
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={openCreate}>
            新增预设
          </Button>,
        ]}
        request={async (params) => {
          const res = await getVscDrcPresetAll({
            keyword: params.keyword,
            userKeyword: params.userKeyword,
            status: params.status,
            pageIndex: params.current,
            pageSize: params.pageSize,
          });
          return pageToTable(res);
        }}
      />
      <Modal
        title={editing ? '编辑 DRC 预设' : '新增 DRC 预设'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={creating || Object.values(updateLoading).some(Boolean)}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {editing && (
            <Form.Item name="uuid" hidden>
              <Input />
            </Form.Item>
          )}
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="如：游戏通道 DRC 预设" maxLength={128} showCount />
          </Form.Item>
          <Form.Item label="所属用户 UUID" name="userUuid">
            <Input placeholder="可留空，留空则为公共预设" maxLength={36} />
          </Form.Item>
          <Form.Item
            label="DRC 文件（.txt）"
            name="files"
            rules={[{ required: true, type: 'array', message: '请上传 DRC 文件' }]}
          >
            <FileUpload fileGroup="vsc-drc-preset-file" max={1} ext={['.txt']} />
          </Form.Item>
          <Form.Item label="图标" name="icon">
            <Select
              placeholder="选择游戏类图标"
              allowClear
              showSearch
              optionFilterProp="label"
              options={gameTagIcons}
            />
          </Form.Item>
          <Form.Item
            label="上线/下线"
            name="status"
            valuePropName="checked"
            getValueFromEvent={(v) => (v ? 1 : 0)}
            getValueProps={(v) => ({ checked: v === 1 })}
          >
            <Switch checkedChildren="上线" unCheckedChildren="下线" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

/** Tab3：通道列表 —— 真实 CURD，使用后端接口；不提供删除（走数据库操作） */
const ChannelTab = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GetVscChannelRes | null>(null);
  const [form] = Form.useForm<PostVscChannelReq & { uuid?: string }>();

  // create
  const { runAsync: createRun, loading: creating } = useRequest(postVscChannel, {
    manual: true,
    onSuccess: () => {
      message.success('新增成功');
      setModalOpen(false);
      actionRef.current?.reload();
    },
  });

  // update
  const { runAsync: updateRun, loading: updating } = useRequest(patchVscChannel, {
    manual: true,
    onSuccess: () => {
      message.success('修改成功');
      setModalOpen(false);
      actionRef.current?.reload();
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setModalOpen(true);
  };

  const openEdit = (record: GetVscChannelRes) => {
    setEditing(record);
    form.setFieldsValue({
      channelKey: record.channelKey,
      name: record.name,
      nameEnUS: record.nameEnUS,
      nameJaJP: record.nameJaJP,
      nameKoKR: record.nameKoKR,
      status: record.status,
      remark: record.remark,
    });
    setModalOpen(true);
  };

  const onModalSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      // channelKey 不允许修改
      const { channelKey: _key, ...patch } = values;
      updateRun(patch, editing.uuid);
    } else {
      createRun(values);
    }
  };

  const columns: ProColumns<GetVscChannelRes>[] = [
    {
      align: 'center',
      title: '序号',
      key: 'index',
      search: false,
      width: 60,
      render: (_v, _r, index) => index + 1,
    },
    {
      align: 'center',
      title: 'UUID',
      dataIndex: 'uuid',
      search: false,
      width: 220,
      render: (_, record) => <UuidCell uuid={record.uuid} />,
    },
    {
      align: 'center',
      title: '通道标识',
      dataIndex: 'channelKey',
      width: 160,
    },
    {
      align: 'center',
      title: '名称（简中）',
      dataIndex: 'name',
      search: false,
      width: 140,
    },
    {
      align: 'center',
      title: '名称（英文）',
      dataIndex: 'nameEnUS',
      search: false,
      width: 140,
      render: (_, record) => record.nameEnUS || '-',
    },
    {
      align: 'center',
      title: '名称（日文）',
      dataIndex: 'nameJaJP',
      search: false,
      width: 140,
      render: (_, record) => record.nameJaJP || '-',
    },
    {
      align: 'center',
      title: '名称（韩文）',
      dataIndex: 'nameKoKR',
      search: false,
      width: 140,
      render: (_, record) => record.nameKoKR || '-',
    },
    {
      align: 'center',
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: { 1: { text: '启用', status: 'Success' }, 0: { text: '禁用', status: 'Default' } },
    },
    {
      align: 'left',
      title: '备注',
      dataIndex: 'remark',
      search: false,
      width: 200,
      render: (_, record) =>
        record.remark ? (
          <Paragraph
            ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
            style={{ marginBottom: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}
          >
            {record.remark}
          </Paragraph>
        ) : (
          '-'
        ),
    },
    {
      align: 'center',
      title: '操作',
      key: 'action',
      search: false,
      width: 80,
      fixed: 'right',
      render: (_v, record) => (
        <Button type="primary" onClick={() => openEdit(record)}>
          修改
        </Button>
      ),
    },
  ];

  return (
    <>
      <ProTable<GetVscChannelRes>
        actionRef={actionRef}
        rowKey="uuid"
        pagination={false}
        search={false}
        options={false}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={openCreate}>
            新增通道
          </Button>,
        ]}
        request={() => {
          return getVscChannelAll({ pageIndex: 1, pageSize: 20 }).then(pageToTable);
        }}
        scroll={{ x: 'max-content' }}
        columns={columns}
      />

      <Modal
        title={editing ? '修改通道' : '新增通道'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onModalSubmit}
        confirmLoading={creating || updating}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="通道标识（唯一）"
            name="channelKey"
            rules={[
              { required: !editing, message: '请输入通道标识' },
              { max: 64, message: '最长 64 字符' },
              { pattern: /^[a-z0-9_]+$/, message: '仅允许小写字母、数字、下划线' },
            ]}
            extra="例如：game / chat / media"
          >
            <Input placeholder="如 game / chat / media" disabled={!!editing} />
          </Form.Item>

          <Form.Item
            label="通道名称（简体中文）"
            name="name"
            rules={[{ required: true, message: '请输入简体中文名称' }]}
          >
            <Input placeholder="游戏通道" maxLength={128} />
          </Form.Item>

          <Form.Item label="通道名称（英文）" name="nameEnUS">
            <Input placeholder="Game" maxLength={128} />
          </Form.Item>

          <Form.Item label="通道名称（日文）" name="nameJaJP">
            <Input placeholder="ゲーム" maxLength={128} />
          </Form.Item>

          <Form.Item label="通道名称（韩文）" name="nameKoKR">
            <Input placeholder="게임" maxLength={128} />
          </Form.Item>

          <Form.Item label="状态" name="status" initialValue={1} valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const VirtualSoundCard = () => {
  return (
    <PageContainer>
      <Tabs
        items={[
          { key: 'config', label: '静态EQ配置', children: <ConfigTab /> },
          { key: 'drc', label: '动态DRC预设', children: <DrcTab /> },
          { key: 'channel', label: '通道列表', children: <ChannelTab /> },
        ]}
      />
    </PageContainer>
  );
};

export default VirtualSoundCard;
