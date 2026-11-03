export enum TimeRangeType {
  ALL = 'all',
  DAY_3 = '3d',
  MONTH_1 = '1m',
  MONTH_3 = '3m',
  CUSTOM = 'custom',
}
export interface DateSelectProps {
  timeRangeName?: string;
  timeName?: string;
  label?: string;
  timeLabel?: string;

  selectSpan?: number;
  pickerSpan?: number;

  defaultValue?: TimeRangeType;

  options?: {
    label: string;
    value?: TimeRangeType;
  }[];
}

const defaultOptions = [
  {
    label: '全部时间',
    value: TimeRangeType.ALL,
  },
  {
    label: '最近3天',
    value: TimeRangeType.DAY_3,
  },
  {
    label: '最近1月',
    value: TimeRangeType.MONTH_1,
  },
  {
    label: '最近3月',
    value: TimeRangeType.MONTH_3,
  },
  {
    label: '自定义',
    value: TimeRangeType.CUSTOM,
  },
];

export default function createDateSelectProps(config?: DateSelectProps) {
  return {
    label: config?.label ?? '时间范围',
    timeLabel: config?.timeLabel ?? ' ',

    TimeRangeName: config?.timeRangeName ?? 'TimeRangeType',
    timeName: config?.timeName ?? 'time',

    selectSpan: config?.selectSpan ?? 6,
    pickerSpan: config?.pickerSpan ?? 6,

    defaultValue: config?.defaultValue ?? TimeRangeType.ALL,
    options: config?.options ?? defaultOptions,
  };
}
