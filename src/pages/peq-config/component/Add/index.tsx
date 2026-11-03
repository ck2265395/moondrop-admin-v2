import FileUpload from '@/components/FileUpload';
import { getAppResourceAll } from '@/services/modules/app-resource';
import { getHeadphoneModelAdminAll } from '@/services/modules/headphone-model-admin';
import type { GetPeqConfigRes, PostPeqConfigReq } from '@/services/modules/peq-config';
import { patchPeqConfig, postPeqConfig } from '@/services/modules/peq-config';
import { getPeqConfigTagAdminAll, TagType } from '@/services/modules/peq-config-tag-admin';
import { getProductAll } from '@/services/modules/product';
import { NULL_UUID, peqType } from '@/utils/data';
import { getProductModelName } from '@/utils/utils';
import {
  DrawerForm,
  ProForm,
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';

type FormData = Omit<PostPeqConfigReq, 'file' | 'headphoneModelUuids'> & {
  files: string[];
  headphoneModelUuid?: string;
};

interface Props {
  data?: GetPeqConfigRes;
  reload?: () => void;
}

interface ProductListItem {
  label: string;
  value: string;
  appResourceRootUuid: string;
  isDacAmp: boolean;
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

  const { runAsync: patchPeqConfigRun } = useRequest(patchPeqConfig, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });

  const { runAsync: postPeqConfigRun } = useRequest(postPeqConfig, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });

  const {
    data: getAppResourceAllData,
    run: getAppResourceAllRun,
    loading: getAppResourceAllLoading,
    mutate: getAppResourceAllMutate,
  } = useRequest(
    async (params: { rootUuid: string }) => {
      const res = await getAppResourceAll(params);
      return res.map((item) => ({
        ...item,
        title: item.name,
        value: item.uuid,
        disabled: item.parentUuid === NULL_UUID,
      }));
    },
    { manual: true },
  );

  const onChangeProductUuid = useCallback((list: ProductListItem[], val: string) => {
    const appResourceRootUuid = list.find((item) => item.value === val)?.appResourceRootUuid;
    if (appResourceRootUuid) {
      getAppResourceAllRun({ rootUuid: appResourceRootUuid });
    } else {
      getAppResourceAllMutate([]);
      message.warning('该商品的资源根节点已被破坏，无法设置功能配置');
    }
  }, []);

  const { data: getProductAllData, run: getProductAllRun } = useRequest(
    async () => {
      const res = await getProductAll({});
      return res.map((item) => ({
        label: getProductModelName(item.model, item.name),
        value: item.uuid,
        appResourceRootUuid: item.appResourceRootUuid,
        isDacAmp: item.isDacAmp,
      }));
    },
    {
      manual: true,
      onSuccess: (res: ProductListItem[]) => {
        if (data?.productUuid) {
          onChangeProductUuid(res, data.productUuid);
        }
      },
    },
  );

  // 加载耳机型号列表
  const { data: headphoneModelList = [], run: getHeadphoneModelRun } = useRequest(
    async () => {
      const res = await getHeadphoneModelAdminAll();
      return res.map((item) => ({
        label: item.title,
        value: item.uuid,
      }));
    },
    { manual: true },
  );

  // 加载标签列表（按 type 分组）
  const { data: tagList = [], run: getTagListRun } = useRequest(
    async () => {
      // 只取启用的
      const res = await getPeqConfigTagAdminAll();
      return res.filter((t) => t.status === 1);
    },
    { manual: true },
  );

  // 标签按 type 分组的 options
  const tagGroupedOptions = useMemo(() => {
    const groups: Record<string, { label: string; value: string }[]> = {};
    tagList.forEach((tag) => {
      const group = typeLabelMap[tag.type] || tag.type;
      if (!groups[group]) groups[group] = [];
      groups[group].push({ label: tag.title, value: tag.uuid });
    });
    return Object.entries(groups).map(([label, options]) => ({
      label,
      options,
    }));
  }, [tagList]);

  // 当前选中产品uuid（用于编辑模式判断）
  const [currentProductUuid, setCurrentProductUuid] = useState<string | undefined>(
    data?.productUuid,
  );

  return (
    <DrawerForm
      form={form}
      onVisibleChange={(val) => {
        if (val) {
          getProductAllRun();
          getHeadphoneModelRun();
          getTagListRun();
          if (data?.uuid) {
            form.setFieldsValue({
              title: data.title,
              files: [data.file],
              desc: data.desc,
              like: data.like,
              dislike: data.dislike,
              status: data.status,
              type: data.type,
              productUuid: data.productUuid,
              headphoneModelUuid: data.headphoneModelUuid,
              tagUuids: data.tagUuids,
              independentChannelTuning: data.independentChannelTuning ?? false,
            });
            setCurrentProductUuid(data.productUuid);
          } else {
            setCurrentProductUuid(undefined);
          }
        } else {
          form.resetFields();
          setCurrentProductUuid(undefined);
        }
      }}
      title={data?.uuid ? '编辑' : '新建'}
      drawerProps={{
        maskClosable: false,
        width: md ? 400 : '100%',
        getContainer: undefined,
      }}
      trigger={<Button type="primary">{data?.uuid ? '编辑' : '新建'}</Button>}
      onFinish={(val) => {
        const values = val as FormData;
        let service;
        // 根据当前产品是否解码耳放决定是否清空耳机型号
        const selectedProduct = getProductAllData?.find((p) => p.value === values.productUuid);
        const isDacAmp = selectedProduct?.isDacAmp ?? false;
        const newValues = {
          ...values,
          file: values.files[0],
          files: undefined,
          headphoneModelUuid: isDacAmp ? values.headphoneModelUuid : undefined,
        };
        if (data?.uuid) {
          service = patchPeqConfigRun(newValues, data.uuid);
        } else {
          service = postPeqConfigRun(newValues);
        }
        return service
          .then(() => {
            return true;
          })
          .catch(() => {
            return false;
          });
      }}
    >
      <ProFormText
        name="title"
        label="标题"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 250,
        }}
      />
      {!data?.uuid && (
        <ProFormSelect
          fieldProps={{
            style: { maxWidth: '100%' },
            showSearch: true,
            optionFilterProp: 'label',
            onChange: (val) => {
              if (getProductAllData) {
                onChangeProductUuid(getProductAllData, String(val));
                const product = getProductAllData.find((p) => p.value === val);
                setCurrentProductUuid(val as string);
                // 如果切换到非解码耳放产品，清空耳机型号
                if (!product?.isDacAmp) {
                  form.setFieldsValue({ headphoneModelUuid: undefined });
                }
              }
            },
          }}
          name="productUuid"
          label="所属产品"
          rules={[{ required: true, message: '请选择' }]}
          options={getProductAllData}
        />
      )}
      {/* 编辑模式：productUuid 隐藏字段，确保 ProFormDependency 能感知 */}
      {data?.uuid && <ProFormSelect hidden name="productUuid" options={getProductAllData} />}
      <ProFormRadio.Group
        fieldProps={{
          style: { maxWidth: '100%' },
          optionType: 'button',
        }}
        name="type"
        label="类型"
        rules={[{ required: true, message: '请选择' }]}
        options={peqType.$list().map((item) => {
          return {
            value: item.key,
            label: item.value,
          };
        })}
      />
      <ProForm.Item
        name="files"
        label="文件"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="peq-config-file" max={1} />
      </ProForm.Item>
      <ProFormTextArea
        name="desc"
        label="备注"
        fieldProps={{
          maxLength: 1200,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormSelect
        name="tagUuids"
        label="标签"
        fieldProps={{
          style: { maxWidth: '100%' },
          mode: 'multiple',
          showSearch: true,
          optionFilterProp: 'label',
          allowClear: true,
          maxTagCount: 3,
          options: tagGroupedOptions,
          listHeight: 320,
          onChange: (val: string[]) => {
            if (val && val.length > 3) {
              message.warning('标签最多选择3个');
            }
          },
        }}
        extra="最多选择3个标签"
      />
      <ProFormText
        name="like"
        label="点赞数"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 50,
        }}
      />
      <ProFormText
        name="dislike"
        label="点踩数"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 50,
        }}
      />
      <ProFormSwitch
        name="independentChannelTuning"
        label="左右声道独立调音"
        initialValue={false}
        checkedChildren="YES"
        unCheckedChildren="NO"
      />
      <ProFormRadio.Group
        name="status"
        label="上线/下线"
        options={[
          {
            label: '上线',
            value: 1,
          },
          {
            label: '下线',
            value: 0,
          },
        ]}
        rules={[{ required: true, message: '请选择' }]}
      />
      {/* 耳机型号下拉：始终渲染，hidden 控制可见性（仅解码耳放类产品可选择，单选） */}
      <ProFormDependency name={['productUuid']}>
        {({ productUuid }) => {
          const product = getProductAllData?.find((p) => p.value === productUuid);
          const isDacAmp = product?.isDacAmp ?? false;
          return (
            <ProFormSelect
              hidden={!isDacAmp}
              fieldProps={{
                style: { maxWidth: '100%' },
                showSearch: true,
                optionFilterProp: 'label',
                allowClear: true,
              }}
              name="headphoneModelUuid"
              label="耳机型号（解码耳放）"
              options={headphoneModelList}
            />
          );
        }}
      </ProFormDependency>
    </DrawerForm>
  );
};
