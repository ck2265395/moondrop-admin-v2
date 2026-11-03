import FileUpload from '@/components/FileUpload';
import type { GetPromoteRes, PostPromoteReq } from '@/services/modules/promote';
import { patchPromote, postPromote } from '@/services/modules/promote';
import { getPromotePositionAll } from '@/services/modules/promote-position';
import { PromoteType } from '@/utils/data';
import { DrawerForm, ProForm, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message } from 'antd';

type FormData = Omit<PostPromoteReq, 'img'> & {
  imgs: string[];
};

interface Props {
  data?: GetPromoteRes;
  reload?: () => void;
}

export default (props: Props) => {
  const { data, reload = () => {} } = props;

  const { md } = Grid.useBreakpoint();

  const [form] = Form.useForm<FormData>();

  const { data: getPromotePositionAllData, loading: getPromotePositionAllLoading } = useRequest(
    getPromotePositionAll,
    {},
  );

  const { runAsync: patchPromoteRun } = useRequest(patchPromote, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload();
    },
  });

  const { runAsync: postPromoteRun } = useRequest(postPromote, {
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
              imgs: [data.img],
              target: data.target,
              type: data.type,
              desc: data.desc,
              promotePositionUuid: data.promotePosition?.uuid,
            });
          }
        } else {
          form.resetFields();
        }
      }}
      title={data?.uuid ? '编辑内部图片' : '新增内部图片'}
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
          img: values.imgs[0],
          imgs: undefined,
        };
        if (data?.uuid) {
          service = patchPromoteRun(newValues, data.uuid);
        } else {
          service = postPromoteRun(newValues);
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
      <ProFormSelect
        fieldProps={{ loading: getPromotePositionAllLoading }}
        name="promotePositionUuid"
        label="图片位"
        rules={[{ required: true, message: '请选择' }]}
        options={getPromotePositionAllData?.map((item) => {
          return {
            label: item.title,
            value: item.uuid,
          };
        })}
      />
      <ProForm.Item
        name="imgs"
        label="图片"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="promote-img" max={1} />
      </ProForm.Item>
      <ProFormText
        hidden
        name="type"
        label="跳转类型"
        rules={[{ required: true, message: '请输入' }]}
        initialValue={PromoteType.Linking}
      />
      <ProFormText
        name="target"
        label="跳转目标"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 1000,
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
