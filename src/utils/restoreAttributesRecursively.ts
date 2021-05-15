type AttributeNode = {
  attribute: Record<string, string>;
  children?: AttributeNode[];
};

export const restoreAttributesRecursively = (
  node: Node,
  attributeNode: AttributeNode
) => {
  if (node instanceof Element) {
    for (const [key, val] of Object.entries(attributeNode.attribute)) {
      node.setAttribute(key, val);
    }

    for (let i = 0; i < node.childNodes.length; i++) {
      restoreAttributesRecursively(
        node.childNodes[i]!,
        attributeNode.children![i]!
      );
    }
  }
};
