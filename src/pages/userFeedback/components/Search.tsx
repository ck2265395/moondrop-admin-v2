import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { ProForm, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { Button, Card, Col, Row } from 'antd';

import AppVersionSelect from '@/components/Selects/AppVersionSelect';
import { createDateSelectProps, DateSelect } from '@/components/Selects/DateSelect/index';
import ProductOtaSelect from '@/components/Selects/PorductOtaSelect';
import { ProblemTypes } from '@/services/modules/user-feedback';

const FeedbackStatusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'replied', label: '已回复' },
];

import { usePageContext } from '../context/PageContext';
import buildSearchParams from '../hooks/buildSearchParams';

export default function Search() {
  const dateSelect = createDateSelectProps();
  const { form, setSearchParams, setPagination } = usePageContext();

  const handleReset = async () => {
    await form.resetFields();
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
    setSearchParams({});
  };

  const handleSubmit = async () => {
    const params = buildSearchParams(form.getFieldsValue(true));
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
    setSearchParams(params);
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <ProForm
        form={form}
        layout="vertical"
        submitter={false}
        onReset={handleReset}
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <DateSelect {...dateSelect} />
          <Col xs={24} sm={12} md={8} lg={6}>
            <ProFormText name="keyword" label="关键词" placeholder="匹配内容、用户名与设备型号" />
          </Col>

          <ProductOtaSelect
            productProps={{
              name: 'product_uuid',
              label: '产品型号',
            }}
            otaProps={{
              name: 'otaversion',
              label: '固件版本',
            }}
          />

          <Col xs={24} sm={12} md={8} lg={6}>
            <ProForm.Item
              name="appversion"
              label="版本号"
              rules={[{ required: false, message: '请选择' }]}
            >
              <AppVersionSelect placeholder="请选择" style={{ maxWidth: '100%' }} />
            </ProForm.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <ProFormSelect name="problem_type" label="问题类型" options={ProblemTypes} />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <ProFormSelect name="status" label="状态" options={FeedbackStatusOptions} />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6} style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginTop: 32 }}>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => form.submit()}>
                查询
              </Button>
            </span>
          </Col>
        </Row>
      </ProForm>
    </Card>
  );
}
