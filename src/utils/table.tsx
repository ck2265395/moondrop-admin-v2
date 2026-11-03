import type { PageResult } from '@/interfaces/PageResult';
import { completeImgUrl } from '@/utils/utils';
import {
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import { Image, Typography } from 'antd';

export const tablePagination = {
  showSizeChanger: true,
  pageSizeOptions: ['10', '20'],
  showTotal: (total: number, [start, end]: [number, number]) =>
    `第 ${start}-${end} 条/总共 ${total} 条`,
};

export const pageToTable = <T extends unknown>(res: PageResult<T>) => ({
  success: true,
  data: res.list,
  total: res.total,
});

export const listToTable = <T extends unknown>(res: T[]) => ({
  success: true,
  data: res,
});

export const renderIndex = (_: unknown, __: unknown, index: number) => index + 1;

export const renderFileLink = (value?: string) => {
  if (!value) {
    return '--';
  }
  const url = completeImgUrl(value);
  return (
    <Typography.Link href={url} target="_blank" rel="noreferrer" ellipsis>
      {value}
    </Typography.Link>
  );
};

export const renderThumb = (value?: string, width = 72) => {
  if (!value) {
    return '--';
  }
  return (
    <Image
      src={completeImgUrl(value)}
      width={width}
      height={width}
      style={{ objectFit: 'cover' }}
    />
  );
};

// ===== 文件图标 =====
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.heic', '.bmp', '.ico'];
const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
const AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'];
const ZIP_EXTS = ['.zip', '.rar', '.7z', '.gz', '.tar'];
const CODE_EXTS = ['.json', '.xml', '.yaml', '.yml', '.csv', '.txt', '.log'];
const FIRMWARE_EXTS = [
  '.bin',
  '.fot',
  '.ufw',
  '.hid',
  '.apk',
  '.exe',
  '.pkg',
  '.dmg',
  '.hex',
  '.fw',
];

export function getExt(fileNameOrKey: string): string {
  const name = fileNameOrKey || '';
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return name.slice(dot).toLowerCase();
}

export function renderFileIcon(fileNameOrKey?: string, size = 48) {
  if (!fileNameOrKey) return '--';
  const ext = getExt(fileNameOrKey);

  if (IMAGE_EXTS.includes(ext)) {
    return (
      <img
        src={completeImgUrl(fileNameOrKey)}
        width={size}
        height={size}
        style={{ objectFit: 'cover', borderRadius: 4 }}
      />
    );
  }
  if (VIDEO_EXTS.includes(ext))
    return <FileImageOutlined style={{ fontSize: size, color: '#1677ff' }} />;
  if (AUDIO_EXTS.includes(ext))
    return <FileImageOutlined style={{ fontSize: size, color: '#722ed1' }} />;
  if (ZIP_EXTS.includes(ext))
    return <FileZipOutlined style={{ fontSize: size, color: '#fa8c16' }} />;
  if (CODE_EXTS.includes(ext))
    return <FileTextOutlined style={{ fontSize: size, color: '#13c2c2' }} />;
  if (ext === '.pdf') return <FilePdfOutlined style={{ fontSize: size, color: '#f5222d' }} />;
  if (ext === '.xlsx' || ext === '.xls')
    return <FileExcelOutlined style={{ fontSize: size, color: '#52c41a' }} />;
  if (ext === '.doc' || ext === '.docx')
    return <FileTextOutlined style={{ fontSize: size, color: '#1677ff' }} />;
  if (FIRMWARE_EXTS.includes(ext))
    return <FileOutlined style={{ fontSize: size, color: '#8c8c8c' }} />;
  return <FileUnknownOutlined style={{ fontSize: size, color: '#8c8c8c' }} />;
}
