import { postFileDirectUploadPolicy } from '@/services/modules/file';
import { completeImgUrl } from '@/utils/utils';
import { PlusOutlined } from '@ant-design/icons';
import { Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

interface FileListItem {
  url?: string; // 绝对url地址，带http开头的
  uid: string; // antd随机值 或 相对url地址，对应Value中的Url
  name: string; // 文件原始名称
  status: UploadFile['status']; // 上传状态
  percent?: number; // 进度条
}

interface Props {
  value?: string[];
  max?: number;
  onChange?: (value?: string[]) => void;
  fileGroup: string;
  id?: string;
  ext?: string[];
  showAccept?: boolean;
  itemRender?: UploadProps['itemRender'];
  /** 是否使用前端直传（默认 true，使用七牛直传；false 则走后端转发） */
  directUpload?: boolean;
  /** 文件大小上限，单位 MB，默认不限制 */
  maxSize?: number;
  /** 上传成功后的回调，返回原始 File 对象和上传后的 key */
  onFileChange?: (file: File, key: string) => void;
}

// 给Form.Item添加value和onChange接口
export default function FileUpload(props: Props) {
  const {
    max = 1,
    value = [],
    onChange = () => {},
    fileGroup,
    id,
    itemRender,
    ext = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.bin', '.txt', '.json'],
    showAccept = true,
    directUpload = true,
    maxSize,
    onFileChange,
  } = props;

  const [fileList, setFileList] = useState<FileListItem[]>([]);

  // 通过tempValue来触发onChange tempValue可以队列设置改变，直接调用onChange会丢失数据
  const [tempValue, setTempValue] = useState<string[]>(value);

  const hackAntdBugRecordUidUrlMap = useRef<Record<string, string>>({});

  const onChanging = useRef<boolean>(false);

  // 缓存 beforeUpload 阶段的 File 对象，供 onFileChange 回调使用
  const pendingFilesMap = useRef<Record<string, File>>({});

  useEffect(() => {
    if (!onChanging.current) {
      setFileList(
        value.map((item) => {
          return {
            url: completeImgUrl(item),
            uid: item,
            name: item,
            status: 'done',
          };
        }),
      );
      setTempValue(value);
    }
    onChanging.current = false;
  }, [value.join(',')]);

  const onChangeValue = (val: string[]) => {
    onChanging.current = true;
    onChange(val);
  };

  useEffect(() => {
    if (tempValue.join(',') !== value.join(',')) {
      onChangeValue(tempValue);
    }
  }, [tempValue]);

  // 上传前判断
  const beforeUpload = useCallback(
    (file: File, fileListParam: File[]) => {
      if (fileListParam.length > max - fileList.length) {
        message.warning('超过最大上传数');
        return false;
      }
      const fileName = file.name.toLowerCase();
      if (!ext.some((item) => fileName.endsWith(item.toLowerCase()))) {
        message.warning(`只可以上传 ${ext.join('，')} 格式的文件!`);
        return false;
      }
      if (maxSize != null && !(file.size / 1024 / 1024 < maxSize)) {
        message.warning(`大小须小于${maxSize}M!`);
        return false;
      }
      // 缓存 File 对象，供上传完成后 onFileChange 回调使用
      const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
      pendingFilesMap.current[fileKey] = file;
      return true;
    },
    [fileList, max, ext],
  );

  const uploadClient = useRef(
    axios.create({
      timeout: 5 * 60000,
    }),
  );

  const uploadProps: UploadProps = {
    id,
    accept: showAccept ? ext.join(',') : undefined,
    listType: 'picture-card',
    multiple: true,
    itemRender,
    beforeUpload,
    fileList: fileList as any,
  };

  if (directUpload) {
    uploadProps.customRequest = async (options) => {
      const file = options.file as File;
      try {
        const policy = await postFileDirectUploadPolicy(fileGroup, {
          fileName: file.name,
          mimeType: file.type,
        });
        const formData = new FormData();
        formData.append('token', policy.uploadToken);
        formData.append('key', policy.key);
        formData.append('file', file);
        await uploadClient.current.post(policy.uploadUrl, formData, {
          onUploadProgress: (event) => {
            options.onProgress?.({
              percent: event.total ? (event.loaded / event.total) * 100 : 0,
            });
          },
        });
        options.onSuccess?.(
          {
            code: 0,
            data: {
              key: policy.key,
            },
          },
          file as any,
        );
      } catch (error) {
        message.error('上传失败，请重试');
        options.onError?.(error as Error);
      }
    };
  } else {
    uploadProps.action = `/api/v1/admin/file/${fileGroup}`;
    uploadProps.headers = { token: localStorage.token };
  }

  return (
    <Upload
      {...uploadProps}
      onChange={(info) => {
        const file = info.file;
        if (file.status === 'done') {
          setTempValue((origin) => {
            return origin.concat([file.response.data.key]);
          });
          // 上传成功后回调，传出原始 File 对象和 key
          const cachedFile =
            pendingFilesMap.current[
              `${file.name}_${file.size}_${(file.originFileObj as File)?.lastModified}`
            ] || file.originFileObj;
          if (cachedFile && onFileChange) {
            onFileChange(cachedFile as File, file.response.data.key);
          }
          // 清理缓存
          const fileKey = `${file.name}_${file.size}_${(file.originFileObj as File)?.lastModified}`;
          delete pendingFilesMap.current[fileKey];
        }
        setFileList(
          info.fileList
            .filter((item) => !!item.status)
            .map((item) => {
              const newItem: FileListItem = {
                url: item.url,
                uid: item.uid,
                name: item.name,
                percent: item.percent,
                status: item.status,
              };
              if (item.response?.code === 0 && !item.url) {
                // 本次新上传的文件
                // antd upload组件会有莫名其妙的乱对应关系，所以只能拿一个对象来记录名字与url
                if (!hackAntdBugRecordUidUrlMap.current[item.uid]) {
                  const url = completeImgUrl(file.response.data.key);
                  newItem.url = url;
                  hackAntdBugRecordUidUrlMap.current[item.uid] = url;
                } else {
                  newItem.url = hackAntdBugRecordUidUrlMap.current[item.uid];
                }
                // 这里没有强行修改uid为item.response.url的原因是uid改变，Upload组件会闪一下，就不改了，删除的时候用绝对地址去判断索引
              }
              return newItem;
            }),
        );
      }}
      onRemove={(file) => {
        const newValue = [...value];
        const index = newValue.findIndex((item) => completeImgUrl(item) === file.url);
        if (index > -1) {
          // 这里有可能是删除上传失败的文件，要判断index
          setTempValue((origin) => {
            const newOrigin = [...origin];
            newOrigin.splice(index, 1);
            return newOrigin;
          });
        }
      }}
    >
      {fileList.length < max && (
        <div>
          <PlusOutlined />
          <div>上传文件</div>
        </div>
      )}
    </Upload>
  );
}
