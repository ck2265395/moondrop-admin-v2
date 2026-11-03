import type { SelectProps } from 'antd';
import { Select } from 'antd';
import { useProductOptions } from './useProductOptions';

export default function ProductSelect(selectProps: SelectProps) {
  const { loading, options } = useProductOptions();
  const { value, onChange, ...props } = selectProps;

  return (
    <Select
      allowClear
      showSearch
      filterOption={(input, option) => {
        const keyword = input.trim().toLowerCase();
        if (!keyword) return true;
        const label = String(option?.label ?? '').toLowerCase();
        const name = String((option as { name?: string })?.name ?? '').toLowerCase();
        return label.includes(keyword) || name.includes(keyword);
      }}
      value={value}
      loading={loading}
      options={options}
      onChange={onChange}
      {...props}
    />
  );
}
