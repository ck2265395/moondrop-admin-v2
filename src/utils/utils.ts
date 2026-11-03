const domain = 'https://cdn.moondroplab.tech/';

export const completeImgUrl = (src: string) => {
  let trueSrc = src;
  if (!/^(http|\/\/)/.test(src)) {
    trueSrc = `${domain}${src}`;
  }
  return trueSrc;
};

export const getProductModelName = (model: string, name?: string) => {
  return `${model}`;
};

export const flat2Tree = <T>(
  arr: T[],
  options?: {
    parent?: string;
    current?: string;
  },
) => {
  const { parent = 'parentUuid', current = 'uuid' } = options ?? {};
  type TreeItem = T & {
    children?: T[];
  };
  const parentTemp: Record<string, TreeItem> = {};
  const res: TreeItem[] = [];
  arr.forEach((item) => {
    // @ts-ignore
    const parentElement = parentTemp[item[parent]];
    // 如果父级缓存访问不到说明是顶级
    if (!parentElement) {
      res.push(item as TreeItem);
    } else if (parentElement.children) {
      parentElement.children.push(item);
    } else {
      parentElement.children = [item];
    }
    // @ts-ignore
    parentTemp[item[current]] = item;
  });
  return res;
};

/** 树形节点的子级按名称升序（递归），节点自身顺序不变（平台层级保持接口返回顺序） */
export const sortTreeChildrenByName = <T extends { children?: T[] }>(
  nodes: T[],
  getName: (node: T) => string,
): T[] =>
  nodes.map((node) => {
    const { children } = node;
    if (!children?.length) return node;
    return {
      ...node,
      children: sortTreeChildrenByName(children, getName).sort((a, b) =>
        getName(a).localeCompare(getName(b), 'en'),
      ),
    };
  });

/**
 * 扁平列表的子级按名称升序，顶级节点（parentUuid === rootUuid）保持原有顺序
 * 供 TreeSelect 的 treeDataSimpleMode 使用（该模式按数组顺序挂接子节点）
 */
export const sortFlatChildrenByName = <T extends { name: string; parentUuid: string }>(
  list: T[],
  rootUuid: string,
): T[] => {
  const roots: T[] = [];
  const childMap = new Map<string, T[]>();
  list.forEach((item) => {
    if (item.parentUuid === rootUuid) {
      roots.push(item);
      return;
    }
    const siblings = childMap.get(item.parentUuid);
    if (siblings) {
      siblings.push(item);
    } else {
      childMap.set(item.parentUuid, [item]);
    }
  });
  const children = Array.from(childMap.values()).flatMap((siblings) =>
    [...siblings].sort((a, b) => a.name.localeCompare(b.name, 'en')),
  );
  return [...roots, ...children];
};
