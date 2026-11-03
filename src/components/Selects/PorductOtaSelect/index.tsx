import { ProForm } from '@ant-design/pro-components';
import type { ColProps, FormItemProps } from 'antd';
import { Col, Form } from 'antd';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import OtaSelect from '../OtaVersionSelect/index';
import ProductSelect from '../ProductSelect/index';

interface SelectSlotConfig {
  name?: string;
  label?: string;
  rules?: FormItemProps['rules'];
  colSpan?: ColProps;
  extra?: ReactNode;
}

interface ProductOtaSelectProps {
  productProps?: SelectSlotConfig;
  otaProps?: SelectSlotConfig;
}

export default function ProductOtaSelect({ productProps, otaProps }: ProductOtaSelectProps) {
  const form = Form.useFormInstance();

  const productUuid = Form.useWatch(productProps?.name ?? 'product_uuid', form);

  useEffect(() => {
    form.resetFields([otaProps?.name ?? 'ota_uuid']);
  }, [productUuid]);

  return (
    <>
      <Col xs={24} sm={12} md={8} lg={6} {...(productProps?.colSpan ?? {})}>
        <ProForm.Item
          name={productProps?.name ?? 'product_uuid'}
          label={productProps?.label ?? '产品型号'}
          rules={productProps?.rules ?? [{ required: false, message: '请选择' }]}
          extra={productProps?.extra}
        >
          <ProductSelect value={productUuid} />
        </ProForm.Item>
      </Col>

      <Col xs={24} sm={12} md={8} lg={6} {...(otaProps?.colSpan ?? {})}>
        <OtaSelect
          name={otaProps?.name ?? 'ota_uuid'}
          label={otaProps?.label ?? '固件版本'}
          productUuid={productUuid}
        />
      </Col>
    </>
  );
}
