import request from '../request';

export interface GetProfilepicsRes {
    uuid: string;
    img: string;
}

export const getProfilepicsAll = (): Promise<GetProfilepicsRes[]> => {
    return request({
        url: '/api/v1/admin/profilepics/all',
    });
};

export interface PostProfilepicsReq {
    img: string;
}
export const postProfilepics = (opt: PostProfilepicsReq): Promise<void> => {
    return request({
        url: '/api/v1/admin/profilepics',
        method: 'POST',
        data: opt,
    });
};

export type PatchProfilepicsReq = Partial<PostProfilepicsReq>;
export const patchProfilepics = (opt: PatchProfilepicsReq, uuid: string): Promise<void> => {
    return request({
        url: `/api/v1/admin/profilepics/${uuid}`,
        method: 'PATCH',
        data: opt,
    });
};

export const deleteProfilepics = (uuid: string): Promise<void> => {
    return request({
        url: `/api/v1/admin/profilepics/${uuid}`,
        method: 'DELETE',
    });
};
