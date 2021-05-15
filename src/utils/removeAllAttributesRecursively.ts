export const removeAllAttributesRecursively = (node: Node) => {
  if (node instanceof Element) {
    while (node.hasAttributes()) {
      for (const attr of Array.from(node.attributes)) {
        node.removeAttribute(attr.name);
      }
    }

    for (const child of Array.from(node.children)) {
      removeAllAttributesRecursively(child);
    }
  }
};
