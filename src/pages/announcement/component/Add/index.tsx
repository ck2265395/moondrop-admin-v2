import type { GetAnnouncementRes, PostAnnouncementReq } from '@/services/modules/announcement';
import { patchAnnouncement, postAnnouncement } from '@/services/modules/announcement';
import {
  DrawerForm,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message } from 'antd';

type FormData = PostAnnouncementReq;

interface Props {
  data?: GetAnnouncementRes;
  reload?: () => void;
}

export default (props: Props) => {
  const { data, reload = () => {} } = props;

  const { md } = Grid.useBreakpoint();

  const [form] = Form.useForm<FormData>();

  const { runAsync: patchAnnouncementRun } = useRequest(patchAnnouncement, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload();
    },
  });

  const { runAsync: postAnnouncementRun } = useRequest(postAnnouncement, {
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
              title_enUS: data.title_enUS,
              title_jaJP: data.title_jaJP,
              title_koKR: data.title_koKR,
              content: data.content,
              content_enUS: data.content_enUS,
              content_jaJP: data.content_jaJP,
              content_koKR: data.content_koKR,
              status: data.status,
            });
          }
        } else {
          form.resetFields();
        }
      }}
      title={data?.uuid ? '编辑弹窗公告' : '新建弹窗公告'}
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
          service = patchAnnouncementRun(newValues, data.uuid);
        } else {
          service = postAnnouncementRun(newValues);
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
        label="弹窗标题"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 50,
        }}
      />
      <ProFormText
        name="title_enUS"
        label="弹窗标题（英文）"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 200,
        }}
      />
      <ProFormText
        name="title_jaJP"
        label="弹窗标题（日文）"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 200,
        }}
      />
      <ProFormText
        name="title_koKR"
        label="弹窗标题（韩文）"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 200,
        }}
      />
      <ProFormTextArea
        name="content"
        label="弹窗内容"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 2000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="content_enUS"
        label="弹窗内容（英文）"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 8000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="content_jaJP"
        label="弹窗内容（日文）"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 8000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="content_koKR"
        label="弹窗内容（韩文）"
        rules={[{ required: true, message: '请输入' }]}
        fieldProps={{
          maxLength: 8000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
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
    </DrawerForm>
  );
};
