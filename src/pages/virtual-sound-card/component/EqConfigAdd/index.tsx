import FileUpload from '@/components/FileUpload';
import { getPeqConfigTagAdminAll, TagType } from '@/services/modules/peq-config-tag-admin';
import { getVscChannelAll } from '@/services/modules/virtual-sound-card-channel';
import {
  patchVscEqConfig,
  postVscEqConfig,
  type GetVscEqConfigRes,
  type PatchVscEqConfigReq,
  type PostVscEqConfigReq,
} from '@/services/modules/virtual-sound-card-eq-config';
import { peqType } from '@/utils/data';
import { completeImgUrl } from '@/utils/utils';
import {
  DrawerForm,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message } from 'antd';

type FormData = Omit<PostVscEqConfigReq, 'file'> & {
  files: string[];
};

interface Props {
  data?: GetVscEqConfigRes;
  reload?: () => void;
}

const typeLabelMap: Record<string, string> = {
  [TagType.GAME]: '游戏',
  [TagType.MUSIC]: '音乐',
  [TagType.MOVIE]: '电影',
};

export default (props: Props) => {
  const { data, reload } = props;
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<FormData>();

  // 通道列表
  const { data: channelList = [], run: getChannelRun } = useRequest(
    async () => {
      const res = await getVscChannelAll({ pageIndex: 1, pageSize: 200 });
      return res.list.map((item) => ({ label: item.name, value: item.uuid }));
    },
    { manual: true },
  );

  // 标签列表（扁平 options + disabled 假分组标题，filterOption 对扁平结构 100% 可匹配）
  const { data: tagFlatOptions = [], run: getTagListRun } = useRequest(
    async () => {
      const res = await getPeqConfigTagAdminAll({ status: 1 });
      const filtered = res.filter((t) => t.status === 1);
      const grouped: Record<string, typeof filtered> = {};
      filtered.forEach((tag) => {
        const g = typeLabelMap[tag.type] || tag.type;
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(tag);
      });
      // 按 游戏→音乐→电影 排序
      const groupOrder = ['游戏', '音乐', '电影'];
      const result: {
        label: any;
        value: string;
        disabled?: boolean;
        searchText?: string;
      }[] = [];
      groupOrder.forEach((g) => {
        if (grouped[g]?.length) {
          result.push({ label: g, value: `__group_${g}`, disabled: true });
          grouped[g].forEach((tag) => {
            result.push({
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <img
                    src={completeImgUrl(tag.icon)}
                    alt=""
                    style={{ width: 16, height: 16, objectFit: 'contain' }}
                  />
                  {tag.title}
                </span>
              ),
              value: tag.uuid,
              searchText: tag.title,
            });
          });
        }
      });
      return result;
    },
    { manual: true },
  );

  const { runAsync: postRun } = useRequest(postVscEqConfig, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });

  const { runAsync: patchRun } = useRequest(patchVscEqConfig, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });

  return (
    <DrawerForm
      form={form}
      onOpenChange={(val) => {
        if (val) {
          getChannelRun();
          getTagListRun();
          if (data?.uuid) {
            form.setFieldsValue({
              title: data.title,
              files: [data.file],
              desc: data.desc,
              channelUuid: data.channelUuid,
              userUuid: data.userUuid ?? undefined,
              source: data.source,
              type: data.type,
              status: data.status,
              tagUuids: data.tags?.map((t) => t.uuid) ?? [],
            });
          } else {
            form.setFieldsValue({ type: 'star', status: 0 });
          }
        } else {
          form.resetFields();
        }
      }}
      title={data?.uuid ? '编辑静态EQ配置' : '新建静态EQ配置'}
      drawerProps={{
        maskClosable: false,
        width: md ? 400 : '100%',
        getContainer: undefined,
      }}
      trigger={<Button type="primary">{data?.uuid ? '编辑' : '新建静态EQ配置'}</Button>}
      onFinish={(val) => {
        const values = val as FormData;
        const newValues = {
          ...values,
          file: values.files[0],
          files: undefined,
          channelUuid: values.channelUuid,
          userUuid: values.userUuid?.trim() || undefined,
          source: values.source?.trim() || undefined,
        };
        if (data?.uuid) {
          return patchRun(newValues as PatchVscEqConfigReq, data.uuid)
            .then(() => true)
            .catch(() => false);
        } else {
          return postRun(newValues as PostVscEqConfigReq)
            .then(() => true)
            .catch(() => false);
        }
      }}
    >
      <ProFormText
        name="title"
        label="标题"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{ maxLength: 250 }}
      />
      <ProFormSelect
        name="channelUuid"
        label="所属通道"
        rules={[{ required: true, message: '请选择' }]}
        fieldProps={{
          showSearch: true,
          optionFilterProp: 'label',
          allowClear: true,
        }}
        options={channelList}
        placeholder="请选择所属通道"
      />
      <ProFormRadio.Group
        fieldProps={{ optionType: 'button' }}
        name="type"
        label="类型"
        initialValue="STAR"
        rules={[{ required: true, message: '请选择类型' }]}
        options={peqType.$list().map((item) => ({
          value: item.key,
          label: item.value,
        }))}
      />
      <Form.Item
        name="files"
        label="EQ 文件"
        rules={[{ required: true, type: 'array', message: '请选择 EQ 文件' }]}
      >
        <FileUpload fileGroup="vsc-eq-config-file" max={1} />
      </Form.Item>
      <ProFormTextArea
        name="desc"
        label="备注"
        fieldProps={{
          maxLength: 1200,
          autoSize: { minRows: 3 },
          showCount: true,
        }}
      />
      <ProFormSelect
        name="tagUuids"
        label="标签"
        rules={[{ type: 'array', max: 3, message: '最多选择3个标签' }]}
        fieldProps={{
          mode: 'multiple',
          showSearch: true,
          // 扁平 options：disabled 的是假分组标题（让它通过），子 option 用 searchText 匹配
          filterOption: (inputValue, option) => {
            if ((option as any)?.disabled) return true;
            return ((option as any)?.searchText ?? '')
              .toLowerCase()
              .includes(inputValue.toLowerCase());
          },
          allowClear: true,
          maxTagCount: 3,
          listHeight: 320,
          onChange: (val: string[]) => {
            if (val?.length > 3) form.setFieldValue('tagUuids', val.slice(0, 3));
          },
        }}
        options={tagFlatOptions}
        extra="最多选择3个标签"
      />
      <ProFormSwitch
        name="status"
        label="上线/下线"
        checkedChildren="上线"
        unCheckedChildren="下线"
      />
    </DrawerForm>
  );
};
