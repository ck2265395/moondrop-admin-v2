import type {
  GetPromotePositionRes,
  PostPromotePositionReq,
} from '@/services/modules/promote-position';
import { patchPromotePosition, postPromotePosition } from '@/services/modules/promote-position';
import { DrawerForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message } from 'antd';

type FormData = PostPromotePositionReq;

interface Props {
  data?: GetPromotePositionRes;
  reload?: () => void;
}

export default (props: Props) => {
  const { data, reload = () => {} } = props;

  const { md } = Grid.useBreakpoint();

  const [form] = Form.useForm<FormData>();

  const { runAsync: patchPromotePositionRun } = useRequest(patchPromotePosition, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload();
    },
  });

  const { runAsync: postPromotePositionRun } = useRequest(postPromotePosition, {
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
              title: data.title,
              code: data.code,
              desc: data.desc,
            });
          }
        } else {
          form.resetFields();
        }
      }}
      title={data?.uuid ? '编辑图片位' : '新建图片位'}
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
        };
        if (data?.uuid) {
          service = patchPromotePositionRun(newValues, data.uuid);
        } else {
          service = postPromotePositionRun(newValues);
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
          maxLength: 50,
        }}
      />
      <ProFormText
        name="code"
        label="CODE"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 50,
        }}
      />
      <ProFormTextArea
        name="desc"
        label="备注"
        fieldProps={{
          maxLength: 500,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
    </DrawerForm>
  );
};
