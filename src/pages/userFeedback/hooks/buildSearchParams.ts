import dayjs from 'dayjs';

import { TimeRangeType } from '@/components/Selects/DateSelect/index';

export interface SearchParams {
  keyword?: string;
  product_uuid?: string;
  otaversion?: string;
  problem_type?: string;
  startTime?: string;
  endTime?: string;
  appversion?: string;
  data_type?: number;
  latitude?: string;
  phone_model?: string;
  brand?: string;
  status?: string;
}

const subtractMap: Partial<Record<TimeRangeType, { value: number; unit: 'day' | 'month' }>> = {
  [TimeRangeType.DAY_3]: { value: 3, unit: 'day' as const },
  [TimeRangeType.MONTH_1]: { value: 1, unit: 'month' as const },
  [TimeRangeType.MONTH_3]: { value: 3, unit: 'month' as const },
};

export default function buildSearchParams(values: Record<string, unknown>): SearchParams {
  const { timeRangeType, time: publishTime, ...rest } = values;
  const params: SearchParams = { ...rest } as SearchParams;

  // 全部
  if (timeRangeType === TimeRangeType.ALL) {
    return params;
  }

  // 自定义范围
  if (timeRangeType === TimeRangeType.CUSTOM && Array.isArray(publishTime)) {
    if (publishTime[0]) {
      params.startTime = dayjs(publishTime[0]).toISOString();
    }
    if (publishTime[1]) {
      params.endTime = dayjs(publishTime[1]).toISOString();
    }
    return params;
  }

  const range = subtractMap[timeRangeType as TimeRangeType];

  if (range) {
    const { value, unit } = range;
    params.startTime = dayjs().subtract(value, unit).startOf('day').toISOString();
    params.endTime = dayjs().endOf('day').toISOString();
  }

  return params;
}
