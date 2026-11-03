import request from "../request";

export interface GetPolicyRes {
    uuid: string;
    version: string;
    privacypolicy: string;
    userpolicy: string;
}

export const getPolicyAll = (): Promise<GetPolicyRes[]> => {
    return request({
        url: '/api/v1/admin/policies/all',
    });
};

export interface PostPolicyReq {
    privacypolicy: string;
    userpolicy: string;
    version: string;
}

export const postPolicy = (opt: PostPolicyReq): Promise<void> => {
    return request({
        url: '/api/v1/admin/policies',
        method: 'POST',
        data: opt,
    });
};

export type PatchPolicyReq = Partial<PostPolicyReq>;
export const patchPolicy = (opt: PatchPolicyReq, uuid: string): Promise<void> => {
    return request({
        url: `/api/v1/admin/policies/${uuid}`,
        method: 'PATCH',
        data: opt,
    });
};

export const deletePolicy = (uuid: string): Promise<void> => {
    return request({
        url: `/api/v1/admin/policies/${uuid}`,
        method: 'DELETE',
    });
};