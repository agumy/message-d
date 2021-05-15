type AttributeNode = {
  attribute: Record<string, string>;
  children?: AttributeNode[];
};

export const getAllAtrributeRecursively = (node: Node) => {
  const attributes: AttributeNode = {
    attribute: {},
  };

  const getAllAttr = (node: Node, attributeNode: AttributeNode) => {
    if (node instanceof Element) {
      for (const attr of Array.from(node.attributes)) {
        attributeNode.attribute[attr.name] = attr.value;
      }

      if (node.childNodes.length) {
        attributeNode.children = [];
        for (const n of Array.from(node.childNodes)) {
          attributeNode.children.push({
            attribute: {},
          });
          getAllAttr(
            n,
            attributeNode.children[attributeNode.children.length - 1]!
          );
        }
      }
    }
  };

  getAllAttr(node, attributes);

  return attributes;
};
