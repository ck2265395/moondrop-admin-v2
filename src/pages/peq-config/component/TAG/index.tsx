import type { PostPeqConfigTagReq } from '@/services/modules/peq-config-tag';
import { getPeqConfigTagAll, postPeqConfigTag } from '@/services/modules/peq-config-tag';
import { DeleteFilled, PlusOutlined } from '@ant-design/icons';
import { DrawerForm, ProFormText } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Card, Form, Grid, Popconfirm, Spin, message } from 'antd';

type FormData = Omit<PostPeqConfigTagReq, 'peqConfigUuid'>;

interface Props {
  peqConfigUuid: string;
}

export default (props: Props) => {
  const { peqConfigUuid } = props;
  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<FormData>();

  const { run: getPeqConfigTagAllRun, loading: getPeqConfigTagAllLoading } = useRequest(
    () => getPeqConfigTagAll({ peqConfigUuid }),
    {
      manual: true,
      onSuccess: (res) => {
        form.setFieldsValue({
          peqConfigTags: res.map((item) => {
            return {
              name: item.name,
            };
          }),
        });
      },
    },
  );
  const { runAsync: postPeqConfigTagRun } = useRequest(postPeqConfigTag, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
    },
  });
  return (
    <DrawerForm
      form={form}
      layout="vertical"
      initialValues={{
        status: true,
      }}
      onVisibleChange={(val) => {
        if (val) {
          getPeqConfigTagAllRun();
        } else {
          form.resetFields();
        }
      }}
      title="Tag"
      drawerProps={{
        maskClosable: false,
        width: md ? 600 : '100%',
        getContainer: undefined,
      }}
      trigger={<Button type="primary">Tags</Button>}
      onFinish={(val) => {
        const values = val as FormData;
        return postPeqConfigTagRun({
          ...values,
          peqConfigUuid,
        })
          .then(() => {
            return true;
          })
          .catch(() => {
            return false;
          });
      }}
    >
      <Spin spinning={getPeqConfigTagAllLoading}>
        <Form.List name="peqConfigTags">
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
                          prevValues.peqConfigTags[index]?.name !==
                          nextValues.peqConfigTags[index]?.name
                        }
                      >
                        {() => {
                          return `${index + 1}. ${
                            form.getFieldValue(['peqConfigTags', index, 'name']) ?? ''
                          }`;
                        }}
                      </Form.Item>
                    }
                    type="inner"
                    key={index}
                    extra={
                      <Popconfirm
                        title="确认删除该Tag"
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
                  新增一个Tag
                </Button>
              </>
            );
          }}
        </Form.List>
      </Spin>
    </DrawerForm>
  );
};
