import type { PatchGlobalConfigUniqueReq } from '@/services/modules/global-config';
import { getGlobalConfigUnique, patchGlobalConfigUnique } from '@/services/modules/global-config';
import { PageContainer, ProForm, ProFormTextArea } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Card, Form, message } from 'antd';
import React from 'react';

export default () => {
  const [form] = Form.useForm();
  const { data, refresh } = useRequest(getGlobalConfigUnique);
  const { runAsync: patchRun } = useRequest(patchGlobalConfigUnique, {
    manual: true,
    onSuccess: () => {
      message.success('保存成功');
      refresh();
    },
  });

  React.useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  return (
    <PageContainer>
      <Card variant="borderless">
        <ProForm
          form={form}
          layout="vertical"
          submitter={{ searchConfig: { submitText: '保存' } }}
          onFinish={(values) =>
            patchRun(values as PatchGlobalConfigUniqueReq)
              .then(() => true)
              .catch(() => false)
          }
        >
          <ProFormTextArea
            name="nonMainlandUserAfterSalesDesc"
            label="非大陆用户售后说明"
            fieldProps={{ autoSize: { minRows: 8 } }}
          />
          <ProFormTextArea
            name="nonMainlandUserAfterSalesDesc_enUS"
            label="非大陆用户售后说明（英文）"
            fieldProps={{ autoSize: { minRows: 8 } }}
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};
