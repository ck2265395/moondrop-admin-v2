import type { FormInstance } from 'antd';
import { createContext, useContext } from 'react';

import type { Pagination } from '@/interfaces/PageResult';
import type { SearchParams } from '../hooks/buildSearchParams';

export interface PageContextValue {
  form: FormInstance;
  reloadVersion: number;
  setReloadVersion: React.Dispatch<React.SetStateAction<number>>;
  searchParams: SearchParams;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams>>;

  pagination: Pagination;
  setPagination: React.Dispatch<React.SetStateAction<Pagination>>;

  deletingId?: string | null;
  openDel: (record: { uuid: string }) => Promise<void>;

  autoTagVisible: boolean;
  setAutoTagVisible: React.Dispatch<React.SetStateAction<boolean>>;

  latitude: string;
  setLatitude: React.Dispatch<React.SetStateAction<string>>;
}

export const PageContext = createContext<PageContextValue | null>(null);
export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageContext must be used within PageContext.Provider');
  }
  return context;
};
