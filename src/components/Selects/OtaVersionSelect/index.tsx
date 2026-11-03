import { getOtaConfigAll } from '@/services/modules/ota-config';
import { ProFormSelect } from '@ant-design/pro-components';
import type { SelectProps } from 'antd';
import { Form, message } from 'antd';
import { useEffect, useState } from 'react';

interface OtaProps extends SelectProps {
  productUuid: string;
  name?: string;
  label?: string;
}

const OtaSelect = (selectProps: OtaProps) => {
  const { productUuid, name = 'otaversion', label = '固件版本', ...props } = selectProps;

  const form = Form.useFormInstance();
  const [otaOptions, setOtaOptions] = useState<{ label: string; value: string }[]>([]);
  const loadOtaVersions = async () => {
    try {
      const res = await getOtaConfigAll({ productUuid });

      const unique = new Map<string, { label: string; value: string }>();
      res.forEach((item) => {
        if (!unique.has(item.version)) {
          unique.set(item.version, {
            label: `${item.version}${item.name ? `（${item.name}）` : ''}`,
            value: item.version,
          });
        }
      });

      setOtaOptions(Array.from(unique.values()));
    } catch (e) {
      message.error('加载失败');
    }
  };

  useEffect(() => {
    if (!productUuid) {
      setOtaOptions([]);
      return;
    }
    loadOtaVersions();
  }, [productUuid]);

  return (
    <>
      <ProFormSelect name={name} label={label} options={otaOptions} fieldProps={props} />
    </>
  );
};

export default OtaSelect;
