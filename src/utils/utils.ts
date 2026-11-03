const domain = 'https://cdn.moondroplab.tech/';

export const completeImgUrl = (src: string) => {
  let trueSrc = src;
  if (!/^(http|\/\/)/.test(src)) {
    trueSrc = `${domain}${src}`;
  }
  return trueSrc;
};
