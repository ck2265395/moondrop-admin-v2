import { getProductAll } from '@/services/modules/product';
import { message } from 'antd';
import { useEffect, useState } from 'react';

export interface ProductOption {
  label: string;
  value: string;
  name: string;
  appResourceRootUuid?: string;
}

export function useProductOptions() {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ProductOption[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getProductAll();
      const opt: ProductOption[] = res.map((item) => ({
        label: item.model,
        value: item.uuid,
        name: item.name ?? '',
        appResourceRootUuid: item.appResourceRootUuid,
      }));

      setOptions(opt);
    } catch (e) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    loading,
    options,
    reload: load,
  };
}
