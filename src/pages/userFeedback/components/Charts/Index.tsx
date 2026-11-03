import type { ReactNode } from 'react';
import { Tabs } from 'antd';

import { Latitude } from '@/services/modules/user-feedback';
import { usePageContext } from '../../context/PageContext';
import DeviceCompatibility from './DeviceCompatibility';
import IssueRank from './IssueRank';
import Keyword from './Keyword';
import Product from './Product';
import ProductHeatmap from './ProductHeatmap';
import TrendLine from './Trend';
import UserData from './UserData';
import VersionTracking from './VersionTracking';
import './index.less';

export default function InitCharts() {
  const { latitude, setLatitude } = usePageContext();

  const renderMap: Record<string, ReactNode> = {
    [Latitude.TREND]: <TrendLine />,
    [Latitude.ISSUE]: <IssueRank />,
    [Latitude.PRODUCT]: <Product />,
    [Latitude.PRODUCT_HEATMAP]: <ProductHeatmap />,
    [Latitude.VERSION_TRACKING]: <VersionTracking />,
    [Latitude.DEVICE_COMPATIBILITY]: <DeviceCompatibility />,
    [Latitude.KEYWORD]: <Keyword />,
    [Latitude.USER_DATA]: <UserData />,
  };

  return (
    <>
      <Tabs
        className="feedback-chart-tabs"
        activeKey={latitude}
        onChange={(key) => setLatitude(key as Latitude)}
        tabBarGutter={16}
        tabBarStyle={{ borderBottom: '1px solid #d9d9d9' }}
        items={[
          { key: Latitude.TREND, label: '反馈趋势' },
          { key: Latitude.ISSUE, label: '问题排行' },
          { key: Latitude.PRODUCT, label: '产品型号分布' },
          { key: Latitude.PRODUCT_HEATMAP, label: '产品问题热力图' },
          { key: Latitude.VERSION_TRACKING, label: '版本问题追踪' },
          { key: Latitude.DEVICE_COMPATIBILITY, label: '设备兼容性' },
          { key: Latitude.KEYWORD, label: '关键词词云' },
          { key: Latitude.USER_DATA, label: '用户数据' },
        ]}
      />
      {renderMap[latitude]}
    </>
  );
}
