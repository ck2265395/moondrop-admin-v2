import FileUpload from '@/components/FileUpload';
import type { GetWallpaperRes, PostWallpaperReq } from '@/services/modules/wallpaper';
import { patchWallpaper, postWallpaper } from '@/services/modules/wallpaper';
import { DrawerForm, ProForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message } from 'antd';

type FormData = Omit<PostWallpaperReq, 'img'> & {
  imgs: string[];
};

interface Props {
  data?: GetWallpaperRes;
  reload?: () => void;
}

export default (props: Props) => {
  const { data, reload = () => {} } = props;

  const { md } = Grid.useBreakpoint();

  const [form] = Form.useForm<FormData>();

  const { runAsync: patchWallpaperRun } = useRequest(patchWallpaper, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload();
    },
  });

  const { runAsync: postWallpaperRun } = useRequest(postWallpaper, {
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
              desc: data.desc,
            });
          }
        } else {
          form.resetFields();
        }
      }}
      title={data?.uuid ? '编辑壁纸' : '新建壁纸'}
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
          service = patchWallpaperRun(newValues, data.uuid);
        } else {
          service = postWallpaperRun(newValues);
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
      <ProForm.Item
        name="imgs"
        label="图片"
        rules={[{ required: true, type: 'array', message: '请选择' }]}
      >
        <FileUpload fileGroup="wallpaper-img" max={1} />
      </ProForm.Item>
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
