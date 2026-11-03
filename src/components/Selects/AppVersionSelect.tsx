import { getAllAppVersion } from '@/services/modules/user-feedback';
import { useRequest } from 'ahooks';
import type { SelectProps } from 'antd';
import { Select } from 'antd';
import { useMemo } from 'react';

export interface AppVersionOption {
  label: string;
  value: string;
}

export interface AppVersionSelectProps
  extends Omit<SelectProps<string | string[]>, 'options' | 'onChange'> {
  params?: Record<string, any>;
  options?: AppVersionOption[];
  onChange?: SelectProps<string | string[]>['onChange'];
}

const formatAppVersionOptions = (list: any[] = []): AppVersionOption[] => {
  return list
    .map((item) => {
      if (typeof item === 'string') {
        return {
          label: item,
          value: item,
        };
      }

      const value = item?.value ?? item?.version ?? item?.appversion ?? item?.appVersion;
      if (!value) {
        return null;
      }

      return {
        label: item?.label ?? item?.name ?? item?.version ?? value,
        value,
      };
    })
    .filter(Boolean) as AppVersionOption[];
};

export default function AppVersionSelect({
  options: propsOptions,
  onChange,
  showSearch = true,
  optionFilterProp = 'label',
  ...props
}: AppVersionSelectProps) {
  // ahooks 3 已移除 formatResult，直接在 data 回调里解包
  const { data: rawData, loading } = useRequest(getAllAppVersion);
  const data = useMemo(() => {
    const res = rawData as { data?: unknown } | unknown[] | undefined;
    return (Array.isArray(res) ? res : res?.data ?? []) as unknown[];
  }, [rawData]);

  const requestOptions = useMemo(() => formatAppVersionOptions(data ?? []), [data]);
  const options = propsOptions ?? requestOptions;

  const handleChange: AppVersionSelectProps['onChange'] = (value, option) => {
    onChange?.(value, option);
  };

  return (
    <Select
      allowClear
      loading={loading}
      optionFilterProp={optionFilterProp}
      options={options}
      showSearch={showSearch}
      onChange={handleChange}
      {...props}
    />
  );
}
