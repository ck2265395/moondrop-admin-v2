declare module '*.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// 由 Umi define 注入，构建时被字符串替换
declare const ENV: {
  title: string;
  env: 'local' | 'test' | 'prod' | string;
  casdoorEndpoint: string;
  casdoorClientId: string;
  v1BaseUrl: string;
};
