import FileUpload from '@/components/FileUpload';
import { getAppResourceAll } from '@/services/modules/app-resource';
import type { GetOtaConfigAllRes, PostOtaConfigReq } from '@/services/modules/ota-config';
import { patchOtaConfig, postOtaConfig } from '@/services/modules/ota-config';
import { getProductAll } from '@/services/modules/product';
import type { GetProductListRes } from '@/services/modules/product';
import { NULL_UUID, OtaConfigType, otaConfigType } from '@/utils/data';
import { getProductModelName, sortFlatChildrenByName } from '@/utils/utils';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  DrawerForm,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Form, Grid, message, Tooltip, TreeSelect } from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo } from 'react';

interface FormFirmwareFile {
  name: string;
  promptToneIndex: number;
  file: string[];
}

interface FormSeparatedFile {
  sku: number;
  files: FormFirmwareFile[];
}

interface FormData extends Omit<PostOtaConfigReq, 'file' | 'status' | 'separatedFiles'> {
  file: string[];
  status: boolean;
  separatedFiles?: FormSeparatedFile[];
}

interface ProductListItem {
  label: string;
  value: string;
  appResourceRootUuid: string;
  hasotaconfig?: boolean;
}

interface Props {
  data?: GetOtaConfigAllRes;
  reload?: () => void;
  link?: boolean;
  icon?: ReactNode;
  // 历史参数（分类树结构时期，新建子节点时传所属父节点信息），分类类型已废弃
  // initParam: {
  //   parentUuid?: string;
  //   parentName?: string;
  // };
}

export default (props: Props) => {
  const { data, reload, link, icon } = props;
  const [form] = Form.useForm<FormData>();
  const { md } = Grid.useBreakpoint();
  const drawerWidth = md ? 400 : '100%';

  const {
    data: appResources,
    run: getAppResourceAllRun,
    loading: getAppResourceAllLoading,
    mutate: getAppResourceAllMutate,
  } = useRequest(getAppResourceAll, {
    manual: true,
  });

  const appResourceOptions = useMemo(() => {
    return sortFlatChildrenByName(appResources ?? [], NULL_UUID).map((item) => {
      return {
        ...item,
        title: item.dictDesc ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {item.name}
            <Tooltip title={item.dictDesc}>
              <QuestionCircleOutlined
                style={{ color: '#bfbfbf', fontSize: 12, cursor: 'default' }}
              />
            </Tooltip>
          </span>
        ) : (
          item.name
        ),
        value: item.uuid,
        disabled: item.parentUuid === NULL_UUID,
      };
    });
  }, [appResources]);

  const onChangeProductUuid = useCallback((list: ProductListItem[], val: string) => {
    const appResourceRootUuid = list.find((item) => item.value === val)?.appResourceRootUuid;
    if (appResourceRootUuid) {
      getAppResourceAllRun({ rootUuid: appResourceRootUuid });
    } else {
      getAppResourceAllMutate([]);
      message.warning('该商品的资源根节点已被破坏，无法设置功能配置');
    }
  }, []);

  const toProductOptions = useCallback((res: GetProductListRes[]) => {
    // 仅展示已勾选 OTA 配置的产品
    return res
      .filter((item) => item.hasotaconfig)
      .map((item) => ({
        label: getProductModelName(item.model, item.name),
        value: item.uuid,
        appResourceRootUuid: item.appResourceRootUuid,
      }));
  }, []);

  const { data: products, run: getProductAllRun } = useRequest(getProductAll, {
    manual: true,
    onSuccess: (res) => {
      if (data?.productUuid) {
        onChangeProductUuid(toProductOptions(res), data.productUuid);
      }
    },
  });

  const productOptions = useMemo(() => toProductOptions(products ?? []), [products, toProductOptions]);

  // 已选功能配置按名称字母升序展示
  const sortAppResourceUuids = useCallback(
    (uuids?: string[]) => {
      if (!uuids?.length) return uuids;
      const nameMap = new Map(appResourceOptions.map((item) => [item.value, item.name]));
      return [...uuids].sort((a, b) => (nameMap.get(a) ?? '').localeCompare(nameMap.get(b) ?? ''));
    },
    [appResourceOptions],
  );

  // 编辑回填时选项可能晚于表单赋值到达，选项就绪后补一次排序
  useEffect(() => {
    const current: string[] | undefined = form.getFieldsValue().appResourceUuids;
    if (!current?.length) return;
    const sorted = sortAppResourceUuids(current);
    if (sorted && sorted.join() !== current.join()) {
      form.setFieldsValue({ appResourceUuids: sorted });
    }
  }, [appResourceOptions, form, sortAppResourceUuids]);

  const submitService = useCallback(
    (action: Promise<unknown>) =>
      action.then(() => {
        message.success('操作成功');
        reload?.();
        return true;
      }),
    [reload],
  );

  return (
    <DrawerForm
      form={form}
      layout="vertical"
      initialValues={{
        status: true,
        // 分类类型已废弃，新建默认选中配置项
        type: OtaConfigType.CONFIG,
      }}
      onOpenChange={(val) => {
        if (val) {
          getProductAllRun({});
          if (data?.uuid) {
            form.setFieldsValue({
              type: data.type,
              name: data.name,
              version: data.version,
              desc: data.desc,
              desc_enUS: data.desc_enUS,
              desc_jaJP: data.desc_jaJP,
              desc_koKR: data.desc_koKR,
              file: data.type === OtaConfigType.CONFIG && data.file?.trim() ? [data.file] : [],
              isSeparatedVersion: data.isSeparatedVersion,
              separatedFiles: (() => {
                const groups = new Map<number, FormSeparatedFile>();
                data.separatedFiles?.forEach((item) => {
                  if (!groups.has(item.sku)) {
                    groups.set(item.sku, { sku: item.sku, files: [] });
                  }
                  groups.get(item.sku)!.files.push({
                    name: item.name ?? '',
                    promptToneIndex: item.promptToneIndex,
                    file: item.file?.trim() ? [item.file] : [],
                  });
                });
                return Array.from(groups.values());
              })(),
              status: data.status === 1,
              appResourceUuids: data.appResourceUuids,
            });
          }
        } else {
          form.resetFields();
        }
      }}
      title={(() => {
        if (data?.uuid) {
          return `编辑 ${data.name} `;
        }
        // 历史文案（分类树结构时期），保留备查
        // if (initParam.parentUuid) {
        //   return `新建所属 ${initParam.parentName} 配置的子节点`;
        // }
        return '新建OTA配置';
      })()}
      drawerProps={{
        maskClosable: false,
        width: drawerWidth,
        getContainer: undefined,
      }}
      trigger={
        icon ? (
          <Tooltip title={data?.uuid ? '编辑' : '新建'}>
            <Button type="text" icon={icon} />
          </Tooltip>
        ) : (
          <Button
            type={link ? 'link' : 'primary'}
            size={link ? 'small' : 'middle'}
            style={link ? { padding: 0, height: 'auto' } : undefined}
          >
            {/* 历史文案（分类树结构时期：data?.uuid ? '编辑' : initParam.parentUuid ? '新建子节点' : '新建'） */}
            {data?.uuid ? '编辑' : '新建'}
          </Button>
        )
      }
      onFinish={(val) => {
        const values = val as FormData;
        const newValues: PostOtaConfigReq = {
          ...values,
          file:
            values.type === OtaConfigType.CONFIG && !values.isSeparatedVersion
              ? values.file?.[0]
              : undefined,
          separatedFiles:
            values.type === OtaConfigType.CONFIG && values.isSeparatedVersion
              ? values.separatedFiles?.flatMap(
                  (group) =>
                    group.files?.map((file) => ({
                      sku: Number(group.sku),
                      name: file.name,
                      promptToneIndex: Number(file.promptToneIndex),
                      file: file.file?.[0],
                    })) ?? [],
                )
              : undefined,
          status: values.status ? 1 : 0,
        };
        const service = data?.uuid
          ? patchOtaConfig(newValues, data.uuid)
          : // 历史逻辑（分类树结构时期），保留备查：新建子节点时携带 parentUuid
            // postOtaConfig({ ...newValues, parentUuid: initParam.parentUuid })
            postOtaConfig(newValues);
        return submitService(service).catch(() => {
          return false;
        });
      }}
    >
      {/* 历史条件（分类树结构时期）：!data?.uuid && !initParam.parentUuid */}
      {!data?.uuid && (
        <ProFormSelect
          fieldProps={{
            style: { maxWidth: '100%' },
            showSearch: true,
            optionFilterProp: 'label',
            onChange: (val) => {
              if (productOptions) {
                onChangeProductUuid(productOptions, String(val));
              }
            },
          }}
          name="productUuid"
          label="所属产品"
          rules={[{ required: true, message: '请选择' }]}
          options={productOptions}
        />
      )}
      {/* 类型：分类类型一直未使用已废弃，隐藏但保留字段值（默认配置项，编辑时回填原值） */}
      <ProFormRadio.Group
        fieldProps={{
          style: { maxWidth: '100%' },
          optionType: 'button',
        }}
        hidden
        disabled={!!data?.uuid}
        name="type"
        label="类型"
        rules={[{ required: true, message: '请选择' }]}
        options={otaConfigType.$list().map((item) => {
          return {
            value: item.key,
            label: item.value,
          };
        })}
      />
      <ProFormText name="name" label="名称" rules={[{ required: true, message: '请输入' }]} />
      <Form.Item noStyle shouldUpdate={(prev, next) => prev.type !== next.type}>
        {() => {
          const type = form.getFieldsValue().type ?? data?.type;
          return (
            type === OtaConfigType.CONFIG && (
              <ProFormText
                name="version"
                label="版本号"
                rules={[{ required: true, message: '请输入' }]}
              />
            )
          );
        }}
      </Form.Item>
      <ProFormTextArea
        name="desc"
        label="描述"
        fieldProps={{
          maxLength: 500,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="desc_enUS"
        label="描述（英文）"
        fieldProps={{
          maxLength: 2000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="desc_jaJP"
        label="描述（日文）"
        fieldProps={{
          maxLength: 2000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="desc_koKR"
        label="描述（韩文）"
        fieldProps={{
          maxLength: 2000,
          autoSize: {
            minRows: 5,
          },
          showCount: true,
        }}
      />
      <Form.Item noStyle shouldUpdate={(prev, next) => prev.type !== next.type}>
        {() => {
          const type = form.getFieldsValue().type ?? data?.type;
          return (
            type === OtaConfigType.CONFIG && (
              <>
                <ProFormSwitch
                  name="isSeparatedVersion"
                  label="分离版本"
                  checkedChildren="是"
                  unCheckedChildren="否"
                />
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, next) => prev.isSeparatedVersion !== next.isSeparatedVersion}
                >
                  {() => {
                    const isSeparatedVersion = form.getFieldsValue().isSeparatedVersion;
                    if (isSeparatedVersion) {
                      return (
                        <Form.List name="separatedFiles">
                          {(fields, { add, remove }) => (
                            <>
                              {fields.map((field, index) => (
                                <div key={field.key} className="admin-inline-list">
                                  <div className="admin-inline-list__header">
                                    <span>SKU版本 {index + 1}</span>
                                    <Button danger onClick={() => remove(field.name)}>
                                      删除
                                    </Button>
                                  </div>
                                  <ProFormDigit
                                    name={[field.name, 'sku']}
                                    label="SKU"
                                    min={0}
                                    rules={[{ required: true, message: '请输入' }]}
                                  />
                                  <Form.List name={[field.name, 'files']}>
                                    {(fileFields, { add: addFile, remove: removeFile }) => (
                                      <>
                                        {fileFields.map((fileField, fileIndex) => (
                                          <div
                                            key={fileField.key}
                                            className="admin-inline-list"
                                            style={{ marginLeft: 16 }}
                                          >
                                            <div className="admin-inline-list__header">
                                              <span>固件 {fileIndex + 1}</span>
                                              <Button
                                                danger
                                                onClick={() => removeFile(fileField.name)}
                                              >
                                                删除
                                              </Button>
                                            </div>
                                            <ProFormDigit
                                              name={[fileField.name, 'promptToneIndex']}
                                              label="提示音索引"
                                              min={0}
                                              rules={[{ required: true, message: '请输入' }]}
                                            />
                                            <ProFormText
                                              name={[fileField.name, 'name']}
                                              label="名称"
                                              fieldProps={{ maxLength: 50 }}
                                              rules={[{ required: true, message: '请输入' }]}
                                            />
                                            <Form.Item
                                              name={[fileField.name, 'file']}
                                              label="固件包"
                                              rules={[
                                                {
                                                  required: true,
                                                  type: 'array',
                                                  message: '请选择',
                                                },
                                              ]}
                                            >
                                              <FileUpload
                                                fileGroup="ota-config-file"
                                                ext={['.bin', '.fot', '.ufw', '.hid']}
                                                showAccept={false}
                                              />
                                            </Form.Item>
                                          </div>
                                        ))}
                                        <Button type="dashed" block onClick={() => addFile({})}>
                                          新增固件
                                        </Button>
                                      </>
                                    )}
                                  </Form.List>
                                </div>
                              ))}
                              <Button type="dashed" block onClick={() => add({ files: [] })}>
                                新增SKU版本
                              </Button>
                            </>
                          )}
                        </Form.List>
                      );
                    }
                    return (
                      <Form.Item
                        name="file"
                        label="固件包"
                        rules={[{ required: true, type: 'array', message: '请选择' }]}
                      >
                        <FileUpload
                          fileGroup="ota-config-file"
                          ext={['.bin', '.fot', '.ufw', '.hid']}
                          showAccept={false}
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </>
            )
          );
        }}
      </Form.Item>
      <Form.Item noStyle shouldUpdate={(prev, next) => prev.type !== next.type}>
        {() => {
          const type = form.getFieldsValue().type ?? data?.type;
          return (
            type === OtaConfigType.CONFIG && (
              <Form.Item name="appResourceUuids" label="功能配置" normalize={sortAppResourceUuids}>
                <TreeSelect
                  loading={getAppResourceAllLoading}
                  treeDefaultExpandAll
                  showArrow
                  multiple
                  style={{ width: '100%' }}
                  treeData={appResourceOptions}
                  treeDataSimpleMode={{
                    id: 'uuid',
                    pId: 'parentUuid',
                    rootPId: NULL_UUID,
                  }}
                  treeNodeFilterProp="name"
                />
              </Form.Item>
            )
          );
        }}
      </Form.Item>
      <ProFormSwitch
        fieldProps={{ style: { maxWidth: '100%' } }}
        name="status"
        label="状态"
        checkedChildren="启用"
        unCheckedChildren="禁用"
        rules={[{ required: true, message: '请选择' }]}
      />
    </DrawerForm>
  );
};
