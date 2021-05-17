type Attribute = {
  [key: string]: string;
};

export const getAllAtrributeRecursively = (node: Node): Attribute[] => {
  const attributes: Attribute[] = [];

  const getAllAttr = (node: Node) => {
    if (node instanceof Element) {
      if (node.hasAttributes()) {
        const attributeMap = Array.from(node.attributes).reduce(
          (prev, curr) => ({ ...prev, [curr.name]: curr.value }),
          {}
        );

        attributes.push(attributeMap);
      }

      for (const n of Array.from(node.childNodes)) {
        getAllAttr(n);
      }
    }
  };

  getAllAttr(node);

  return attributes;
};
