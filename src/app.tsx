// 运行时配置：initialState 占位，后续接入登录态 / 权限
export async function getInitialState(): Promise<{ name: string }> {
  return { name: 'Moondrop Admin V2' };
}
