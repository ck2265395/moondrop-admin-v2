import FileUpload from '@/components/FileUpload';
import type {
  GetDongleOtaConfigIndexRes,
  PostDongleOtaConfigReq,
} from '@/services/modules/dongle-ota-config';
import { patchDongleOtaConfig, postDongleOtaConfig } from '@/services/modules/dongle-ota-config';
import { getProductAll } from '@/services/modules/product';
import { getProductModelName } from '@/utils/utils';
import {
  DrawerForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

interface FormData extends Omit<PostDongleOtaConfigReq, 'file' | 'status'> {
  file: string[];
  status: boolean;
}

interface Props {
  data?: GetDongleOtaConfigIndexRes;
  reload?: () => void;
  icon?: ReactNode;
}

export default (props: Props) => {
  const { data, reload, icon } = props;
  const [form] = Form.useForm<FormData>();
  const { md } = Grid.useBreakpoint();
  const drawerWidth = md ? 400 : '100%';

  const { data: products, run: getProductAllRun } = useRequest(getProductAll, {
    manual: true,
  });

  // 仅展示支持 Dongle（接收器）固件升级的产品
  const productOptions = useMemo(
    () =>
      (products ?? [])
        .filter((item) => item.isDongleUpgradable)
        .map((item) => ({
          label: getProductModelName(item.model, item.name),
          value: item.uuid,
        })),
    [products],
  );

  const submitService = (action: Promise<unknown>) =>
    action.then(() => {
      message.success('操作成功');
      reload?.();
      return true;
    });

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      initialValues={{
        status: true,
      }}
      onOpenChange={(val) => {
        if (val) {
          getProductAllRun({});
          if (data?.uuid) {
            form.setFieldsValue({
              productUuid: data.productUuid,
              name: data.name,
              version: data.version,
              file: data.file ? [data.file] : [],
              desc: data.desc,
              desc_enUS: data.desc_enUS,
              desc_jaJP: data.desc_jaJP,
              desc_koKR: data.desc_koKR,
              status: data.status === 1,
            });
          }
        } else {
          form.resetFields();
        }
      }}
      title={data?.uuid ? `编辑 ${data.name}` : '新建Dongle OTA配置'}
      drawerProps={{
        maskClosable: false,
        width: drawerWidth,
        getContainer: undefined,
      }}
      trigger={
        icon ? (
          <Tooltip title={data?.uuid ? '编辑' : '新建'}>
            <Button type="text" icon={icon} />
          </Tooltip>
        ) : (
          <Button type="primary">{data?.uuid ? '编辑' : '新建'}</Button>
        )
      }
      onFinish={(val) => {
        const values = val as FormData;
        const newValues: PostDongleOtaConfigReq = {
          ...values,
          file: values.file?.[0],
          status: values.status ? 1 : 0,
        };
        const service = data?.uuid
          ? patchDongleOtaConfig(newValues, data.uuid)
          : postDongleOtaConfig(newValues);
        return submitService(service).catch(() => {
          return false;
        });
      }}
    >
      <ProFormSelect
        fieldProps={{
          style: { maxWidth: '100%' },
          showSearch: true,
          optionFilterProp: 'label',
        }}
        name="productUuid"
        label="所属产品"
        rules={[{ required: true, message: '请选择' }]}
        options={productOptions}
      />
      <ProFormText
        name="name"
        label="名称"
        fieldProps={{ maxLength: 250 }}
        rules={[{ required: true, message: '请输入' }]}
      />
      <ProFormText
        name="version"
        label="版本号"
        fieldProps={{ maxLength: 50 }}
        rules={[{ required: true, message: '请输入' }]}
      />
      <Form.Item
        name="file"
        label="固件包"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload
          fileGroup="dongle-ota-config-file"
          ext={['.bin', '.fot', '.ufw', '.hid']}
          showAccept={false}
        />
      </Form.Item>
      <ProFormTextArea
        name="desc"
        label="描述"
        fieldProps={{
          maxLength: 500,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="desc_enUS"
        label="描述（英文）"
        fieldProps={{
          maxLength: 2000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="desc_jaJP"
        label="描述（日文）"
        fieldProps={{
          maxLength: 2000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="desc_koKR"
        label="描述（韩文）"
        fieldProps={{
          maxLength: 2000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="status"
        label="状态"
        checkedChildren="启用"
        unCheckedChildren="禁用"
        rules={[{ required: true, message: '请选择' }]}
      />
    </DrawerForm>
  );
};
