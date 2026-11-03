import type { PostOtaConfigEqualizerReq } from '@/services/modules/ota-config-equalizer';
import {
  getOtaConfigEqualizerAll,
  postOtaConfigEqualizer,
} from '@/services/modules/ota-config-equalizer';
import { DeleteFilled, PlusOutlined } from '@ant-design/icons';
import { DrawerForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Card, Form, Grid, message, Popconfirm, Spin, Tooltip } from 'antd';
import type { ReactNode } from 'react';

type FormData = Omit<PostOtaConfigEqualizerReq, 'otaConfigUuid'>;

interface Props {
  otaConfigUuid: string;
  link?: boolean;
  icon?: ReactNode;
}

export default (props: Props) => {
  const { otaConfigUuid, link, icon } = props;
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<FormData>();

  const { run: getOtaConfigEqualizerAllRun, loading: getOtaConfigEqualizerAllLoading } = useRequest(
    () => getOtaConfigEqualizerAll({ otaConfigUuid }),
    {
      manual: true,
      onSuccess: (res) => {
        form.setFieldsValue({
          otaConfigEqualizers: res.map((item) => {
            return {
              name: item.name,
              name_enUS: item.name_enUS,
              name_jaJP: item.name_jaJP,
              name_koKR: item.name_koKR,
              desc: item.desc,
              desc_enUS: item.desc_enUS,
              desc_jaJP: item.desc_jaJP,
              desc_koKR: item.desc_koKR,
            };
          }),
        });
      },
    },
  );

  const submitService = (action: Promise<unknown>) =>
    action.then(() => {
      message.success('操作成功');
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
          getOtaConfigEqualizerAllRun();
        } else {
          form.resetFields();
        }
      }}
      title="EQ配置"
      drawerProps={{
        maskClosable: false,
        width: md ? 600 : '100%',
        getContainer: undefined,
      }}
      trigger={
        icon ? (
          <Tooltip title="EQ配置">
            <Button type="text" icon={icon} />
          </Tooltip>
        ) : (
          <Button
            type={link ? 'link' : 'primary'}
            size={link ? 'small' : 'middle'}
            style={link ? { padding: 0, height: 'auto' } : undefined}
          >
            EQ配置
          </Button>
        )
      }
      onFinish={(val) => {
        const values = val as FormData;
        return submitService(
          postOtaConfigEqualizer({
            ...values,
            otaConfigUuid,
          }),
        ).catch(() => {
          return false;
        });
      }}
    >
      <Spin spinning={getOtaConfigEqualizerAllLoading}>
        <Form.List name="otaConfigEqualizers">
          {(fields, { add, remove }) => {
            return (
              <>
                {fields.map(({ name: index }) => (
                  <Card
                    className="mb-10"
                    title={
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, nextValues) =>
                          prevValues.otaConfigEqualizers[index]?.name !==
                          nextValues.otaConfigEqualizers[index]?.name
                        }
                      >
                        {() => {
                          return `${index + 1}. ${
                            form.getFieldValue(['otaConfigEqualizers', index, 'name']) ?? ''
                          }`;
                        }}
                      </Form.Item>
                    }
                    type="inner"
                    key={index}
                    extra={
                      <Popconfirm
                        title="确认删除该EQ项"
                        onConfirm={() => {
                          remove(index);
                        }}
                      >
                        <DeleteFilled />
                      </Popconfirm>
                    }
                  >
                    <ProFormText
                      name={[index, 'name']}
                      label="名称"
                      rules={[{ required: true, message: '请输入' }]}
                      fieldProps={{ maxLength: 50 }}
                    />
                    <ProFormText
                      name={[index, 'name_enUS']}
                      label="名称（英文）"
                      rules={[{ required: true, message: '请输入' }]}
                      fieldProps={{ maxLength: 200 }}
                    />
                    <ProFormText
                      name={[index, 'name_jaJP']}
                      label="名称（日文）"
                      rules={[{ required: true, message: '请输入' }]}
                      fieldProps={{ maxLength: 200 }}
                    />
                    <ProFormText
                      name={[index, 'name_koKR']}
                      label="名称（韩文）"
                      rules={[{ required: true, message: '请输入' }]}
                      fieldProps={{ maxLength: 200 }}
                    />
                    <ProFormTextArea
                      name={[index, 'desc']}
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
                      name={[index, 'desc_enUS']}
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
                      name={[index, 'desc_jaJP']}
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
                      name={[index, 'desc_koKR']}
                      label="描述（韩文）"
                      fieldProps={{
                        maxLength: 2000,
                        autoSize: {
                          minRows: 5,
                        },
                        showCount: true,
                      }}
                    />
                  </Card>
                ))}
                <Button
                  type="primary"
                  ghost
                  block
                  icon={<PlusOutlined />}
                  onClick={() => {
                    add();
                  }}
                >
                  新增一个EQ项
                </Button>
              </>
            );
          }}
        </Form.List>
      </Spin>
    </DrawerForm>
  );
};
