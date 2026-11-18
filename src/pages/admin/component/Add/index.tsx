import FileUpload from '@/components/FileUpload';
import type { GetAdminRes, PostAdminReq } from '@/services/modules/admin';
import { patchAdmin, postAdmin } from '@/services/modules/admin';
import { completeImgUrl } from '@/utils/utils';
import { DrawerForm, ProForm, ProFormSwitch, ProFormText } from '@ant-design/pro-components';
import { Button, Form, Grid, message } from 'antd';

interface Props {
  data?: GetAdminRes;
  reload?: () => void;
}

interface FormData extends Omit<PostAdminReq, 'username' | 'password'> {
  username?: string;
  password?: string;
  confirmPassword?: string;
  /** 头像上传值：新上传为 CDN key，编辑回显为完整 URL */
  avatars?: string[];
}

export default (props: Props) => {
  const { data, reload = () => {} } = props;

  const { md } = Grid.useBreakpoint();

  const [form] = Form.useForm<FormData>();

  const handleSubmit = (values: FormData) => {
    const { avatars, ...rest } = values;
    const newValues = {
      ...rest,
      // 上传接口返回的是不带域名的 key，入库统一存完整地址；Casdoor 头像本身已是完整地址
      casdoorAvatar: avatars?.[0] ? completeImgUrl(avatars[0]) : '',
      status: values.status ? 1 : 0,
    } as FormData;
    const service = data?.uuid
      ? patchAdmin(newValues, data.uuid)
      : (() => {
          delete newValues.confirmPassword;
          return postAdmin(newValues as PostAdminReq);
        })();
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
              company: data.company,
              department: data.department,
              avatars: data.casdoorAvatar ? [data.casdoorAvatar] : [],
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
      <ProForm.Item name="avatars" label="头像">
        <FileUpload fileGroup="admin-avatar" max={1} />
      </ProForm.Item>
      <ProFormText name="job" label="职位" rules={[{ required: true, message: '请输入' }]} />
      <ProFormText name="mobile" label="手机号" rules={[{ required: true, message: '请输入' }]} />
      <ProFormText name="company" label="公司" />
      <ProFormText name="department" label="部门" />
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
