import type { PageFilter } from '@/interfaces/PageFilter'
import type { PageResult } from '@/interfaces/PageResult'
import request from '../request'

export interface GetUserDestroyLogReq extends PageFilter {
  username?: string
  email?: string
  phone?: string
  channel?: string
}

export interface GetUserDestroyLogRes {
  uuid: string
  userUuid: string
  username: string
  nickname: string
  email: string
  phone: string
  profilepic: string
  channel: string
  destroyIp: string
  /** 注销 IP 归属地（国家|省|市|运营商） */
  region: string
  createTime: number
}

/** 用户注销记录列表（国内注销 / 海外注销 / 后台删除） */
export const getUserDestroyLogs = (
  params?: GetUserDestroyLogReq,
): Promise<PageResult<GetUserDestroyLogRes>> =>
  request({
    url: '/api/v1/admin/user-destroy-logs',
    params,
  })
