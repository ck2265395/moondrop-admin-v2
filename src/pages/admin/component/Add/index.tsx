import type { GetAdminRes, PostAdminReq } from '@/services/modules/admin';
import { patchAdmin, postAdmin } from '@/services/modules/admin';
import { DrawerForm, ProFormSwitch, ProFormText } from '@ant-design/pro-components';
import { Button, Form, Grid, message } from 'antd';

interface Props {
  data?: GetAdminRes;
  reload?: () => void;
}

interface FormData extends Omit<PostAdminReq, 'username' | 'password'> {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export default (props: Props) => {
  const { data, reload = () => {} } = props;

  const { md } = Grid.useBreakpoint();

  const [form] = Form.useForm<FormData>();

  const handleSubmit = (values: FormData) => {
    const newValues = {
      ...values,
      status: values.status ? 1 : 0,
    } as FormData;
    const service = data?.uuid
      ? patchAdmin(newValues, data.uuid)
      : postAdmin(newValues as PostAdminReq);
    return service
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
    <DrawerForm<FormData>
      form={form}
      onOpenChange={(val) => {
        if (val) {
          if (data?.uuid) {
            form.setFieldsValue({
              name: data.name,
              mobile: data.mobile,
              job: data.job,
              status: data.status,
              casdoorUsername: data.casdoorUsername ?? undefined,
            });
          }
        } else {
          form.resetFields();
        }
      }}
      title={data?.uuid ? '编辑员工' : '新建员工'}
      drawerProps={{
        maskClosable: false,
        width: md ? 400 : '100%',
        getContainer: undefined,
      }}
      trigger={<Button type="primary">{data?.uuid ? '编辑' : '新建'}</Button>}
      onFinish={handleSubmit}
    >
      {!data?.uuid && (
        <>
          <ProFormText
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入' }]}
          />
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
        </>
      )}
      <ProFormText name="name" label="姓名" rules={[{ required: true, message: '请输入' }]} />
      <ProFormText name="job" label="职位" rules={[{ required: true, message: '请输入' }]} />
      <ProFormText name="mobile" label="手机号" rules={[{ required: true, message: '请输入' }]} />
      <ProFormText
        name="casdoorUsername"
        label="Casdoor 账号名"
        tooltip="绑定后可通过企业统一登录进入后台，留空则仅支持账密登录"
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
