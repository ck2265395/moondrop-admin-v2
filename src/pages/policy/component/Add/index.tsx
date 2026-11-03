import FileUpload from '@/components/FileUpload';
import type { GetPolicyRes, PostPolicyReq } from '@/services/modules/policy';
import { patchPolicy, postPolicy } from '@/services/modules/policy';
import { DrawerForm, ProForm, ProFormText } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message } from 'antd';

type FormData = Omit<PostPolicyReq, 'privacypolicy' | 'userpolicy'> & {
  privacypolicy: string[];
  userpolicy: string[];
};

interface Props {
  data?: GetPolicyRes;
  reload?: () => void;
}

export default (props: Props) => {
  const { data, reload = () => {} } = props;

  const { md } = Grid.useBreakpoint();

  const [form] = Form.useForm<FormData>();

  const { runAsync: patchPolicyRun } = useRequest(patchPolicy, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload();
    },
  });

  const { runAsync: postPolicyRun } = useRequest(postPolicy, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload();
    },
  });

  return (
    <DrawerForm
      form={form}
      onOpenChange={(val) => {
        if (val) {
          if (data?.uuid) {
            form.setFieldsValue({
              version: data.version,
              privacypolicy: [data.privacypolicy],
              userpolicy: [data.userpolicy],
            });
          }
        } else {
          form.resetFields();
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
        const newValues = {
          ...values,
          privacypolicy: values.privacypolicy?.[0],
          userpolicy: values.userpolicy?.[0],
        };
        if (data?.uuid) {
          service = patchPolicyRun(newValues, data.uuid);
        } else {
          service = postPolicyRun(newValues);
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
      <ProFormText name="version" label="版本号" rules={[{ required: true, message: '请输入' }]} />
      <ProForm.Item
        name="privacypolicy"
        label="隐私协议"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="privacypolicy" max={1} />
      </ProForm.Item>
      <ProForm.Item
        name="userpolicy"
        label="用户协议"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="userpolicy" max={1} />
      </ProForm.Item>
    </DrawerForm>
  );
};
