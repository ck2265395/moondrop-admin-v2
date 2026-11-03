import request from '../request';

export interface GetAnnouncementRes {
  uuid: string;
  title: string;
  title_enUS: string;
  title_jaJP: string;
  title_koKR: string;
  content: string;
  content_enUS: string;
  content_jaJP: string;
  content_koKR: string;
  publishTime: number;
  status: 0 | 1;
}
export const getAnnouncementAll = (): Promise<GetAnnouncementRes[]> => {
  return request({
    url: '/api/v1/admin/announcements/all',
  });
};

export interface PostAnnouncementReq {
  title: string;
  title_enUS: string;
  title_jaJP: string;
  title_koKR: string;
  content: string;
  content_enUS: string;
  content_jaJP: string;
  content_koKR: string;
  status: 0 | 1;
}
export const postAnnouncement = (opt: PostAnnouncementReq): Promise<void> => {
  return request({
    url: '/api/v1/admin/announcements',
    method: 'POST',
    data: opt,
  });
};

export type PatchAnnouncementReq = Partial<PostAnnouncementReq>;
export const patchAnnouncement = (opt: PatchAnnouncementReq, uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/announcements/${uuid}`,
    method: 'PATCH',
    data: opt,
  });
};

export const deleteAnnouncement = (uuid: string): Promise<void> => {
  return request({
    url: `/api/v1/admin/announcements/${uuid}`,
    method: 'DELETE',
  });
};
