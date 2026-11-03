import type { GetAdminRes } from '@/services/modules/admin';
import { patchAdmin } from '@/services/modules/admin';
import { DrawerForm, ProFormText } from '@ant-design/pro-components';
import { Button, Form, Grid, message } from 'antd';

interface Props {
  data: GetAdminRes;
  reload?: () => void;
}

export default (props: Props) => {
  const { data, reload = () => {} } = props;
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<{
    password: string;
    confirmPassword: string;
  }>();

  const handleSubmit = (values: { password: string; confirmPassword: string }) => {
    return patchAdmin({ password: values.password }, data.uuid)
      .then(() => {
        message.success('操作成功');
        reload();
        return true;
      })
      .catch(() => {
        return false;
      });
  };

  return (
    <DrawerForm
      form={form}
      title="修改密码"
      onOpenChange={(val) => {
        if (!val) {
          form.resetFields();
        }
      }}
      drawerProps={{
        maskClosable: false,
        width: md ? 400 : '100%',
        getContainer: undefined,
      }}
      trigger={<Button type="primary">修改密码</Button>}
      onFinish={handleSubmit}
    >
      <ProFormText.Password
        name="password"
        label="密码"
        rules={[{ required: true, message: '请输入' }]}
      />
      <ProFormText.Password
        name="confirmPassword"
        label="确认密码"
        rules={[
          {
            required: true,
            validator: (_: unknown, val: string) => {
              if (val !== form.getFieldValue('password')) {
                return Promise.reject(new Error('请与密码一致'));
              }
              return Promise.resolve();
            },
          },
        ]}
      />
    </DrawerForm>
  );
};
