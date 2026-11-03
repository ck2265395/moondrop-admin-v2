import { WordCloud } from '@ant-design/plots';
import { ProTable } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Slider } from 'antd';
import { memo, useEffect, useMemo, useState, type FC } from 'react';

import type { StatisticsKeywordRes } from '@/services/modules/user-feedback';
import { getStsKeywords, Latitude } from '@/services/modules/user-feedback';
import { usePageContext } from '../../context/PageContext';

const SLIDER_RED = '#f5222d';

// 词频越高颜色越深：浅珊瑚 → 红 → 深红，共 9 级色带
const WORD_COLOR_RAMP = [
  '#ffe2d8',
  '#ffc5b2',
  '#ffa187',
  '#ff8067',
  '#ff614d',
  '#f34437',
  '#df2b2d',
  '#bd1827',
  '#920d1c',
];

const MIN_WORD_LIMIT = 15;
const WORD_FONT_SIZE_RANGE = [24, 190];

const getWordFontSize = (value: number, minValue: number, maxValue: number): number => {
  const [minSize, maxSize] = WORD_FONT_SIZE_RANGE;
  if (maxValue <= minValue) return Math.round((minSize + maxSize) / 2);
  const valueRatio =
    (Math.log1p(value) - Math.log1p(minValue)) / (Math.log1p(maxValue) - Math.log1p(minValue));
  return Math.round(minSize + Math.pow(valueRatio, 1.4) * (maxSize - minSize));
};

const KeywordTable = memo(
  ({ dataSource, loading }: { dataSource: StatisticsKeywordRes[]; loading: boolean }) => (
    <ProTable<StatisticsKeywordRes>
      className="keyword-frequency-table"
      loading={loading}
      rowKey="text"
      dataSource={dataSource}
      search={false}
      options={false}
      columns={[
        {
          align: 'left',
          title: '词条',
          dataIndex: 'text',
          width: '50%',
        },
        {
          align: 'left',
          title: '出现次数',
          dataIndex: 'value',
          width: '50%',
          sorter: (a, b) => Number(a.value) - Number(b.value),
          defaultSortOrder: 'descend',
        },
      ]}
    />
  ),
);

interface KeywordLimitSliderProps {
  min: number;
  max: number;
  value: number;
  onCommit: (value: number) => void;
}

function KeywordLimitSlider({ min, max, value, onCommit }: KeywordLimitSliderProps) {
  const [draftValue, setDraftValue] = useState(value);
  const [showRange, setShowRange] = useState(false);

  useEffect(() => {
    setDraftValue(value);
  }, [value, min, max]);

  const position = max > min ? ((draftValue - min) / (max - min)) * 100 : 0;
  const currentLabelStyle = {
    left: `${position}%`,
    transform:
      position === 0 ? 'none' : position === 100 ? 'translateX(-100%)' : 'translateX(-50%)',
  };

  return (
    <div>
      <div style={{ color: 'rgba(0,0,0,.75)', fontSize: 14, marginBottom: 2 }}>
        词云展示的词条数量上限（按词频截断）
      </div>
      <div
        style={{ position: 'relative', padding: '20px 0 18px' }}
        onMouseEnter={() => setShowRange(true)}
        onMouseLeave={() => setShowRange(false)}
      >
        <div style={{ position: 'relative', margin: '0 6px' }}>
          <span
            style={{
              ...currentLabelStyle,
              position: 'absolute',
              top: -20,
              color: SLIDER_RED,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: '16px',
              whiteSpace: 'nowrap',
            }}
          >
            {draftValue}
          </span>
          <Slider
            min={min}
            max={max}
            value={draftValue}
            tooltip={{ open: false }}
            styles={{
              track: { background: SLIDER_RED },
              rail: { background: '#d9d9d9' },
              handle: { borderColor: SLIDER_RED },
            }}
            onChange={(nextValue) => {
              setDraftValue(nextValue as number);
              onCommit(nextValue as number);
            }}
          />
          {showRange ? (
            <>
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: -18,
                  color: '#8c8c8c',
                  fontSize: 12,
                  lineHeight: '16px',
                }}
              >
                {min}
              </span>
              <span
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: -18,
                  color: '#8c8c8c',
                  fontSize: 12,
                  lineHeight: '16px',
                }}
              >
                {max}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Keyword() {
  const { searchParams, latitude } = usePageContext();
  const params = useMemo(() => ({ ...searchParams, latitude: Latitude.KEYWORD }), [searchParams, latitude]);

  const { data = [], loading } = useRequest(() => getStsKeywords(params), { refreshDeps: [params] });

  // 接口已按词频倒序，兜底再排一次，保证色带映射正确
  const sortedData = useMemo(
    () => [...data].sort((a, b) => Number(b.value) - Number(a.value)),
    [data],
  );

  const maxLimit = Math.max(1, sortedData.length);
  const minLimit = Math.min(MIN_WORD_LIMIT, maxLimit);
  const [limit, setLimit] = useState(0);

  useEffect(() => {
    if (sortedData.length) {
      setLimit(Math.max(minLimit, Math.ceil((sortedData.length + 1) / 2)));
    }
  }, [sortedData, minLimit]);

  const currentLimit = Math.min(Math.max(limit || minLimit, minLimit), maxLimit);
  const currentData = useMemo(() => sortedData.slice(0, currentLimit), [sortedData, currentLimit]);

  // 词频越高颜色越深（按色带索引取色）
  const wordColors = useMemo(
    () =>
      currentData.map((item, index) => {
        const values = currentData.map((d) => Number(d.value) || 0);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const value = values[index];
        const colorIndex = Math.min(
          WORD_COLOR_RAMP.length - 1,
          Math.floor(
            (maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 1) *
              WORD_COLOR_RAMP.length,
          ),
        );
        return WORD_COLOR_RAMP[colorIndex];
      }),
    [currentData],
  );

  const config = useMemo(() => {
    const values = currentData.map((item) => Number(item.value) || 0);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const countRatio =
      sortedData.length > MIN_WORD_LIMIT
        ? Math.min(1, (currentData.length - MIN_WORD_LIMIT) / (sortedData.length - MIN_WORD_LIMIT))
        : 1;
    const minFontSize =
      WORD_FONT_SIZE_RANGE[0] +
      (1 - countRatio) * (WORD_FONT_SIZE_RANGE[1] - WORD_FONT_SIZE_RANGE[0]) * 0.35;

    return {
      data: currentData.map((item, index) => ({
        text: item.text,
        value: values[index],
        color: wordColors[index],
        wordSize: Math.max(minFontSize, getWordFontSize(values[index], minValue, maxValue)),
      })),
      height: 700,
      autoFit: true,
      textField: 'text',
      valueField: 'value',
      colorField: 'color',
      scale: { color: { type: 'identity' } },
      layout: {
        fontSize: (datum: { wordSize: number }) => datum.wordSize,
        font: '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
        fontWeight: 900,
        rotate: 0,
        spiral: 'rectangular',
        padding: 0,
      },
      style: {
        fontFamily: '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
        fontWeight: 900,
        stroke: (datum: { color: string }) => datum.color,
        lineWidth: 1,
      },
      tooltip: {
        title: 'text',
        items: [{ field: 'value', name: '出现次数' }],
      },
    };
  }, [currentData, sortedData.length, wordColors]);

  const header = (
    <KeywordLimitSlider min={minLimit} max={maxLimit} value={currentLimit} onCommit={setLimit} />
  );

  return (
    <>
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          backgroundColor: '#fff',
          padding: '8px 12px 14px',
          marginTop: 20,
        }}
      >
        <div style={{ padding: '4px 8px 0' }}>{header}</div>
        <WordCloud loading={loading} {...config} />
        <div style={{ color: '#8c8c8c', fontSize: 13, padding: '0 8px' }}>
          共 {currentData.length} 个词；按词频排布，字号越大表示在当前筛选正文中出现相对越多。
        </div>

        <div style={{ fontWeight: 600, color: 'rgba(0,0,0,.85)', margin: '20px 8px 12px' }}>
          词条出现次数（与上图词表一致，可排序、筛选）
        </div>
        <KeywordTable dataSource={sortedData} loading={loading} />
      </div>
    </>
  );
}
