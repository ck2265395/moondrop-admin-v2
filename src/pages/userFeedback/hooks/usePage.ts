import { Form, message } from 'antd';
import { useState } from 'react';

import type { Pagination } from '@/interfaces/PageResult';
import { deleteFeedback, Latitude } from '@/services/modules/user-feedback';
import type { SearchParams } from './buildSearchParams';

/**
 * @desc usePage
 */

export default () => {
  const [form] = Form.useForm();
  const [reloadVersion, setReloadVersion] = useState(0);

  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const openDel = async (record: { uuid: string }) => {
    setDeletingId(record.uuid);
    try {
      await deleteFeedback(record.uuid);
      message.success('删除成功');
      // setSearchParams(prev => ({ ...prev }))
      setReloadVersion((v) => v + 1);
    } finally {
      setDeletingId(null);
    }
  };

  // 自动打标 Modal
  const [autoTagVisible, setAutoTagVisible] = useState(false);

  // 图表
  const [latitude, setLatitude] = useState<string>(Latitude.TREND);

  return {
    form,

    reloadVersion,
    setReloadVersion,

    searchParams,
    setSearchParams,
    pagination,
    setPagination,

    deletingId,
    openDel,

    autoTagVisible,
    setAutoTagVisible,

    latitude,
    setLatitude,
  };
};
