import FileUpload from '@/components/FileUpload';
import { getAppResourceAllRoot } from '@/services/modules/app-resource';
import type { GetProductListRes, PostProductReq, ProductSkuItem } from '@/services/modules/product';
import { patchProduct, postProduct } from '@/services/modules/product';
import { deviceType } from '@/utils/data';
import {
  DeleteFilled,
  DownOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  DrawerForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Grid,
  Input,
  Popconfirm,
  Row,
  Tag,
  Tooltip,
  message,
} from 'antd';
import { useMemo, useState, type ReactElement } from 'react';

type DisplayPlatformValue = 1 | 2 | 4 | 8;

/** 颜色版本 Form.List 项类型 */
interface VariantItem {
  sku?: string;
  isDefault?: boolean;
  bannerImg?: string[];
  bannerImgNight?: string[];
  squareBannerImg?: string[];
  squareBannerImgNight?: string[];
  bannerImgV2?: string[];
  hubDetailImg?: string[];
  bannerImgT?: string[];
  bannerImgNightT?: string[];
  bannerImgLT?: string[];
  bannerImgRT?: string[];
  bannerImgNightLT?: string[];
  bannerImgNightRT?: string[];
}

type VariantBannerKey = Exclude<keyof VariantItem, 'sku' | 'isDefault'>;

interface FormData
  extends Omit<
    PostProductReq,
    | 'manual'
    | 'manual_enUS'
    | 'manual_jaJP'
    | 'manual_koKR'
    | 'bannerImg'
    | 'bannerImgNight'
    | 'squareBannerImg'
    | 'squareBannerImgNight'
    | 'bannerImgV2'
    | 'hubDetailImg'
    | 'bannerImgT'
    | 'bannerImgNightT'
    | 'bannerImgLT'
    | 'bannerImgRT'
    | 'bannerImgNightLT'
    | 'bannerImgNightRT'
    | 'sellpic'
    | 'freqResponse'
    | 'isDisplay'
    | 'variants'
  > {
  manual: string[];
  manual_enUS: string[];
  manual_jaJP: string[];
  manual_koKR: string[];
  sellpic: string[];
  freqResponse: string[];
  isDisplay?: DisplayPlatformValue[];
  variants?: VariantItem[];
}

interface Props {
  data?: GetProductListRes;
  reload?: () => void;
  trigger?: ReactElement;
}

const displayPlatformOptions: { label: string; value: DisplayPlatformValue }[] = [
  { label: 'Android', value: 1 },
  { label: 'iOS', value: 2 },
  { label: 'Web', value: 4 },
  { label: 'PC', value: 8 },
];

const dongleUpgradeTypeOptions: { label: string; value: string }[] = [
  { label: '接收器固件升级', value: 'dongle' },
  { label: '耳机固件升级', value: 'headphone' },
];

const getDisplayPlatforms = (value?: number): DisplayPlatformValue[] => {
  return displayPlatformOptions
    .filter((item) => ((value ?? 0) & item.value) === item.value)
    .map((item) => item.value);
};

const getDisplayCode = (value?: DisplayPlatformValue[]) => {
  return value?.reduce<number>((acc, item) => acc | item, 0) ?? 0;
};

/** banner 图字段按类型分组（2 栏布局，日间/夜间成对） */
const bannerGroups: { label: string; items: { key: VariantBannerKey; label: string }[] }[] = [
  {
    label: '产品列表切图',
    items: [
      { key: 'bannerImg', label: '旧版产品列表切图' },
      { key: 'bannerImgNight', label: '产品列表切图（夜间）' },
      { key: 'bannerImgV2', label: '新版产品列表切图' },
      { key: 'hubDetailImg', label: 'HUB产品详情页切图' },
    ],
  },
  {
    label: '方形切图',
    items: [
      { key: 'squareBannerImg', label: '方形产品切图' },
      { key: 'squareBannerImgNight', label: '方形产品切图（夜间）' },
    ],
  },
  {
    label: '手势设置默认切图',
    items: [
      { key: 'bannerImgT', label: '手势设置默认切图' },
      { key: 'bannerImgNightT', label: '手势设置默认切图（夜间）' },
    ],
  },
  {
    label: '手势设置-左耳切图',
    items: [
      { key: 'bannerImgLT', label: '手势设置-左耳切图' },
      { key: 'bannerImgNightLT', label: '手势设置-左耳切图（夜间）' },
    ],
  },
  {
    label: '手势设置-右耳切图',
    items: [
      { key: 'bannerImgRT', label: '手势设置-右耳切图' },
      { key: 'bannerImgNightRT', label: '手势设置-右耳切图（夜间）' },
    ],
  },
];

const ALL_BANNER_KEYS: VariantBannerKey[] = bannerGroups.flatMap((g) => g.items.map((i) => i.key));

const bannerFileGroup = 'product-banner-img';

/** 创建空的颜色版本（给 Form.List 用） */
const createEmptyVariant = (sku = '', isDefault = false): VariantItem => {
  const v: VariantItem = { sku, isDefault };
  ALL_BANNER_KEYS.forEach((key) => {
    v[key] = [];
  });
  return v;
};

/** 从后端 GetProductListRes 构造第一个颜色版本 */
const buildVariantFromData = (data?: GetProductListRes): VariantItem => {
  const v = createEmptyVariant('', true);
  if (!data) return v;
  ALL_BANNER_KEYS.forEach((key) => {
    const value = data[key as keyof GetProductListRes] as string;
    v[key] = value ? [value] : [];
  });
  return v;
};

/** 从后端 SKU 行构造颜色版本（编辑回显，string -> [string] 适配上传组件） */
const buildVariantFromSku = (sku: ProductSkuItem): VariantItem => {
  const v = createEmptyVariant(sku.sku ?? '', !!sku.isDefault);
  ALL_BANNER_KEYS.forEach((key) => {
    const value = sku[key];
    v[key] = value ? [value] : [];
  });
  return v;
};

export default (props: Props) => {
  const { data, reload, trigger } = props;

  const { md } = Grid.useBreakpoint();
  const [form] = Form.useForm<FormData>();

  /** 收起的颜色版本下标集合：默认全部展开，用户手动收起 */
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(() => new Set<number>());

  const toggleCollapsed = (index: number) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  /** 将指定颜色版本设为默认（同一产品仅一个默认） */
  const setDefaultVariant = (target: number) => {
    const variants: VariantItem[] = form.getFieldValue('variants') ?? [];
    form.setFieldValue(
      'variants',
      variants.map((v, i) => ({ ...v, isDefault: i === target })),
    );
  };

  /** 删除颜色版本；若删的是默认项，剩余第一项自动成为默认 */
  const removeVariant = (remove: (index: number) => void, index: number) => {
    const variants: VariantItem[] = form.getFieldValue('variants') ?? [];
    const wasDefault = !!variants[index]?.isDefault;
    remove(index);
    if (wasDefault) {
      const rest: VariantItem[] = form.getFieldValue('variants') ?? [];
      form.setFieldValue(
        'variants',
        rest.map((v, i) => ({ ...v, isDefault: i === 0 })),
      );
    }
  };

  const allFileFields: {
    key: keyof Pick<
      FormData,
      'manual' | 'manual_enUS' | 'manual_jaJP' | 'manual_koKR' | 'sellpic' | 'freqResponse'
    >;
    label: string;
    group: string;
    ext?: string[];
  }[] = [
    { key: 'manual', label: '产品说明书', group: 'product-manual', ext: ['.pdf'] },
    { key: 'manual_enUS', label: '产品说明书（英文）', group: 'product-manual', ext: ['.pdf'] },
    { key: 'manual_jaJP', label: '产品说明书（日文）', group: 'product-manual', ext: ['.pdf'] },
    { key: 'manual_koKR', label: '产品说明书（韩文）', group: 'product-manual', ext: ['.pdf'] },
    {
      key: 'sellpic',
      label: '产品详情页',
      group: 'sellpic',
      ext: ['.jpg', '.jpeg', '.png', '.html', '.htm'],
    },
    { key: 'freqResponse', label: '频响文件', group: 'freq-response-file', ext: ['.txt', '.json'] },
  ];

  const { data: appResourceRoots, run: getAppResourceAllRootRun } = useRequest(
    getAppResourceAllRoot,
    { manual: true },
  );
  const appResourceRootOptions = useMemo(
    () => appResourceRoots?.map((item) => ({ label: item.name, value: item.uuid })),
    [appResourceRoots],
  );

  const { runAsync: patchProductRun } = useRequest(patchProduct, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });

  const { runAsync: postProductRun } = useRequest(postProduct, {
    manual: true,
    onSuccess: () => {
      message.success('操作成功');
      reload?.();
    },
  });

  const handleSubmit = (val: FormData) => {
    const formVariants = (val.variants ?? []).map((v) => ({
      ...v,
      sku: v.sku?.trim() ?? '',
    }));

    // SKU 必填校验
    const emptySkuIndex = formVariants.findIndex((v) => !v.sku);
    if (emptySkuIndex !== -1) {
      message.error(`请填写"颜色版本${emptySkuIndex + 1}"的 SKU`);
      return Promise.resolve(false);
    }

    // SKU 重复校验
    const skuValues = formVariants.map((v) => v.sku);
    const duplicateIndex = skuValues.findIndex((sku, i) => skuValues.indexOf(sku) !== i);
    if (duplicateIndex !== -1) {
      message.error(`SKU "${skuValues[duplicateIndex]}" 重复，请检查`);
      return Promise.resolve(false);
    }

    // 默认SKU归一化：只有一个时强制默认；多个时未标记则第一条默认，仅第一个标记生效
    let defaultIndex = formVariants.findIndex((v) => v.isDefault);
    if (defaultIndex === -1) defaultIndex = 0;

    // 转换为后端 variants（上传组件值是 string[]，取第一个）
    const variants: ProductSkuItem[] = formVariants.map((v, i) => {
      const item: ProductSkuItem = {
        sku: v.sku,
        isDefault: i === defaultIndex,
      };
      ALL_BANNER_KEYS.forEach((key) => {
        item[key] = v[key]?.[0] ?? '';
      });
      return item;
    });

    let service;
    const newValues: any = { ...val, variants };

    // 非 banner 文件字段：取数组第一个
    allFileFields.forEach((item) => {
      newValues[item.key] = val[item.key]?.[0];
    });

    // banner 图片统一走 variants，顶层旧字段由后端从默认组双写
    ALL_BANNER_KEYS.forEach((key) => {
      delete newValues[key];
    });

    newValues.isDisplay = getDisplayCode(val.isDisplay);
    // 关闭 Dongle 升级时清空支持类型，避免残留脏数据
    newValues.dongleUpgradeTypes = val.isDongleUpgradable ? val.dongleUpgradeTypes ?? [] : [];

    if (data?.uuid) {
      service = patchProductRun(newValues, data.uuid);
    } else {
      service = postProductRun(newValues);
    }
    return service.then(() => true).catch(() => false);
  };

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      initialValues={{
        isDongleUpgradable: false,
        variants: [createEmptyVariant('1', true)],
      }}
      onVisibleChange={(val) => {
        if (val) {
          if (data?.uuid) {
            form.setFieldsValue({
              model: data.model,
              name: data.name,
              type: data.type,
              targetlink: data.targetlink,
              hasotaconfig: data.hasotaconfig,
              istws: data.istws,
              isSpeaker: data.isSpeaker,
              isGamingHeadphone: data.isGamingHeadphone,
              isDacAmp: data.isDacAmp,
              isDongleUpgradable: data.isDongleUpgradable,
              dongleUpgradeTypes: data.dongleUpgradeTypes ?? [],
              languageType: data.languageType,
              eqBands: data.eqBands,
              gainRange: data.gainRange,
              qRange: data.qRange,
              isTotalGainSupported: data.isTotalGainSupported,
              isPreGainSupported: data.isPreGainSupported,
              supportedFilterTypes: data.supportedFilterTypes,
              isDisplay: getDisplayPlatforms(data.isDisplay),
              variants: data.variants?.length
                ? data.variants.map((sku) => buildVariantFromSku(sku))
                : [buildVariantFromData(data)],
              ...allFileFields.reduce((acc, item) => {
                const value = data[item.key as keyof GetProductListRes] as string;
                return { ...acc, [item.key]: value ? [value] : [] };
              }, {}),
            });
          } else {
            getAppResourceAllRootRun();
            form.setFieldsValue({ variants: [createEmptyVariant('1', true)] });
          }
        } else {
          form.resetFields();
          // 抽屉关闭时重置展开状态，下次打开全部展开
          setCollapsedSet(new Set<number>());
        }
      }}
      title={data?.uuid ? '编辑产品' : '新建产品'}
      drawerProps={{
        maskClosable: false,
        width: md ? 480 : '100%',
        getContainer: undefined,
        // 预渲染抽屉内容，避免 useForm 实例未连接 Form 的控制台警告
        forceRender: true,
      }}
      trigger={trigger ?? <Button type="primary">{data?.uuid ? '编辑' : '新建'}</Button>}
      onFinish={handleSubmit}
    >
      {!data?.uuid && (
        <ProFormSelect
          fieldProps={{ style: { maxWidth: '100%' } }}
          name="appResourceRootUuid"
          label="芯片"
          rules={[{ required: true, message: '请选择' }]}
          options={appResourceRootOptions}
        />
      )}
      <ProFormText name="model" label="型号" rules={[{ required: true, message: '请输入' }]} />
      <ProFormText name="name" label="名称" rules={[{ required: true, message: '请输入' }]} />
      <ProFormSelect
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="type"
        label="类型"
        rules={[{ required: true, message: '请选择' }]}
        options={deviceType.$list().map((item) => ({ value: item.key, label: item.value }))}
      />
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="hasotaconfig"
        label="是否OTA配置"
        checkedChildren="启用"
        unCheckedChildren="禁用"
        rules={[{ required: true, message: '请选择' }]}
      />
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="istws"
        label="是否TWS"
        checkedChildren="是"
        unCheckedChildren="否"
      />
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="isSpeaker"
        label="是否音箱"
        checkedChildren="是"
        unCheckedChildren="否"
      />
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="isGamingHeadphone"
        label="是否游戏耳机"
        checkedChildren="是"
        unCheckedChildren="否"
      />
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="isDacAmp"
        label="是否解码耳放"
        checkedChildren="是"
        unCheckedChildren="否"
      />
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="isDongleUpgradable"
        label="是否支持Dongle升级"
        checkedChildren="是"
        unCheckedChildren="否"
      />
      <ProFormDependency name={['isDongleUpgradable']}>
        {({ isDongleUpgradable }) =>
          isDongleUpgradable ? (
            <ProFormSelect
              fieldProps={{ style: { maxWidth: '100%' }, mode: 'multiple' }}
              name="dongleUpgradeTypes"
              label="Dongle升级支持类型"
              options={dongleUpgradeTypeOptions}
            />
          ) : null
        }
      </ProFormDependency>
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="isTotalGainSupported"
        label="支持总增益"
        checkedChildren="是"
        unCheckedChildren="否"
      />
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="isPreGainSupported"
        label="支持前级增益"
        checkedChildren="是"
        unCheckedChildren="否"
      />
      <ProFormText
        name="targetlink"
        label="商品链接"
        rules={[{ required: true, message: '请输入' }]}
      />
      <ProFormText name="languageType" label="语言类型" />
      <ProFormDigit name="eqBands" label="EQ段数" min={0} />
      <ProFormText name="gainRange" label="增益范围" />
      <ProFormText name="qRange" label="Q值范围" />
      <ProFormText name="supportedFilterTypes" label="支持滤波器类型" />

      <Form.List name="variants">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ name: index }) => {
              const collapsed = collapsedSet.has(index);
              return (
                <Card
                  key={index}
                  size="small"
                  type="inner"
                  className="mb-10"
                  title={
                    <span
                      style={{
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      onClick={() => toggleCollapsed(index)}
                    >
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, nextValues) =>
                          prevValues.variants?.[index]?.sku !== nextValues.variants?.[index]?.sku ||
                          prevValues.variants?.[index]?.isDefault !==
                            nextValues.variants?.[index]?.isDefault
                        }
                      >
                        {() => {
                          const sku = form.getFieldValue(['variants', index, 'sku']);
                          const isDefault = form.getFieldValue(['variants', index, 'isDefault']);
                          return (
                            <>
                              {`颜色版本${sku ? ` — ${sku}` : ''}`}
                              {isDefault ? (
                                <Tag color="gold" style={{ marginLeft: 8, fontSize: 11 }}>
                                  默认
                                </Tag>
                              ) : null}
                            </>
                          );
                        }}
                      </Form.Item>
                    </span>
                  }
                  extra={
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {fields.length > 1 ? (
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, nextValues) =>
                            prevValues.variants?.[index]?.isDefault !==
                            nextValues.variants?.[index]?.isDefault
                          }
                        >
                          {() =>
                            form.getFieldValue(['variants', index, 'isDefault']) ? (
                              <Tooltip title="默认SKU">
                                <StarFilled style={{ color: '#faad14', cursor: 'default' }} />
                              </Tooltip>
                            ) : (
                              <Tooltip title="设为默认">
                                <StarOutlined
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setDefaultVariant(index)}
                                />
                              </Tooltip>
                            )
                          }
                        </Form.Item>
                      ) : null}
                      <span style={{ cursor: 'pointer' }} onClick={() => toggleCollapsed(index)}>
                        {collapsed ? <DownOutlined /> : <UpOutlined />}
                      </span>
                      {fields.length > 1 ? (
                        <Popconfirm
                          title="确认删除该颜色版本？"
                          onConfirm={() => removeVariant(remove, index)}
                        >
                          <DeleteFilled />
                        </Popconfirm>
                      ) : null}
                    </span>
                  }
                >
                  {collapsed ? null : (
                    <>
                      <Form.Item
                        label="SKU"
                        name={[index, 'sku']}
                        rules={[{ required: true, message: '请输入SKU' }]}
                      >
                        <Input size="small" placeholder="请输入SKU" maxLength={50} />
                      </Form.Item>
                      {bannerGroups.map((group) => (
                        <div key={group.label} style={{ marginBottom: 12 }}>
                          <Row gutter={[6, 6]}>
                            {group.items.map((item) => (
                              <Col key={item.key} xs={24} sm={12}>
                                <Form.Item
                                  name={[index, item.key]}
                                  label={item.label}
                                  labelCol={{
                                    style: { fontSize: 11, color: '#666', marginBottom: 2 },
                                  }}
                                  colon={false}
                                >
                                  <FileUpload fileGroup={bannerFileGroup} />
                                </Form.Item>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ))}
                    </>
                  )}
                </Card>
              );
            })}
            <Button
              type="primary"
              ghost
              block
              icon={<PlusOutlined />}
              onClick={() => {
                const newIndex = fields.length;
                setCollapsedSet((prev) => {
                  const next = new Set(prev);
                  next.delete(newIndex);
                  return next;
                });
                add(createEmptyVariant(String(newIndex + 1), false));
              }}
              style={{ marginTop: 8 }}
            >
              新增颜色版本
            </Button>
          </>
        )}
      </Form.List>

      {/* 非 banner 的文件字段保持原样 */}
      <Divider orientation="left">产品文件</Divider>
      {allFileFields.map((item) => (
        <Form.Item key={item.key} name={item.key} label={item.label}>
          <FileUpload fileGroup={item.group} ext={item.ext} />
        </Form.Item>
      ))}

      <ProFormSelect
        fieldProps={{ style: { maxWidth: '100%' }, mode: 'multiple' }}
        name="isDisplay"
        label="产品说明书APP可见平台"
        options={displayPlatformOptions}
      />
    </DrawerForm>
  );
};
