import FileUpload from '@/components/FileUpload';
import type { GetProfilepicsRes, PostProfilepicsReq } from '@/services/modules/profilepics';
import { patchProfilepics, postProfilepics } from '@/services/modules/profilepics';
import { DrawerForm, ProForm } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message } from 'antd';
import type { ReactElement } from 'react';

type FormData = Omit<PostProfilepicsReq, 'img'> & {
  imgs: string[];
};

interface Props {
  data?: GetProfilepicsRes;
  reload?: () => void;
  trigger?: ReactElement;
}

export default (props: Props) => {
  const { data, reload = () => {}, trigger } = props;

  const { md } = Grid.useBreakpoint();

  const [form] = Form.useForm<FormData>();

  const { runAsync: patchProfilepicsRun } = useRequest(patchProfilepics, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload();
    },
  });

  const { runAsync: postProfilepicsRun } = useRequest(postProfilepics, {
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
              imgs: [data.img],
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
      trigger={trigger ?? <Button type="primary">{data?.uuid ? '编辑' : '新建'}</Button>}
      onFinish={(val) => {
        const values = val as FormData;
        let service;
        const newValues = {
          ...values,
          img: values.imgs[0],
          imgs: undefined,
        };
        if (data?.uuid) {
          service = patchProfilepicsRun(newValues, data.uuid);
        } else {
          service = postProfilepicsRun(newValues);
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
      <ProForm.Item
        name="imgs"
        label="图片"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="profilepic" max={1} />
      </ProForm.Item>
    </DrawerForm>
  );
};
