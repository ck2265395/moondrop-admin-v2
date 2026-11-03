import { ProFormDateRangePicker, ProFormSelect } from '@ant-design/pro-components';
import { Col, Form } from 'antd';

import type { DateSelectProps } from './createDateSelectProps';
import { TimeRangeType } from './createDateSelectProps';

export default function DateSelect({
  timeRangeName = 'timeRangeType',
  timeName = 'publishTime',

  label = '时间范围',
  timeLabel = ' ',

  selectSpan = 6,
  pickerSpan = 8,

  defaultValue = TimeRangeType.ALL,

  options = [],
}: DateSelectProps) {
  const form = Form.useFormInstance();

  const timeRangeType = Form.useWatch(timeRangeName, form);

  return (
    <>
      <Col xs={24} sm={12} md={8} lg={6}>
        <ProFormSelect
          name={timeRangeName}
          label={label}
          initialValue={defaultValue}
          options={options}
        />
      </Col>
      {timeRangeType === TimeRangeType.CUSTOM && (
        <Col xs={24} sm={12} md={8} lg={6}>
          <ProFormDateRangePicker name={timeName} label={timeLabel} />
        </Col>
      )}
    </>
  );
}
