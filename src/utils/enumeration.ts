type Key = string | number;

export default function enumeration<K extends Key, V = string>(
  enumer: Record<string, K | string>,
  data: Record<K, V>,
){
  return {
    ...data,
    $list(){
      const keyValueArr = Object.entries(enumer);
      return keyValueArr.filter(([nickname])=>{
        // 枚举变量如果有数字类型的值（key），循环的时候会把枚举左右互换参与循环，这里去掉能转换成数字的别名
        return Number.isNaN(Number(nickname));
      }).map((keyValue)=>{
        const key = keyValue[1] as K;
        return {
          key,
          value: data[key] as V
        }
      })
    },
  }
}
