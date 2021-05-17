export const removeAllAttributesRecursively = (node: Node) => {
  let i = 0;

  const removeAllAttributes = (node: Node) => {
    if (node instanceof Element) {
      let hasAttribute = node.hasAttributes();

      while (node.hasAttributes()) {
        for (const attr of Array.from(node.attributes)) {
          node.removeAttribute(attr.name);
        }
      }

      if (hasAttribute) {
        node.setAttribute("i", String(i++));
      }

      for (const child of Array.from(node.children)) {
        removeAllAttributes(child);
      }
    }
  };

  removeAllAttributes(node);
};
