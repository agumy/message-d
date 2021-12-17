type AttributeNode = {
  [key: string]: string;
};

export const restoreAttributesRecursively = (
  node: Node,
  attributeNodes: AttributeNode[]
) => {
  if (node instanceof Element) {
    if (node.hasAttribute("i")) {
      const i = Number(node.getAttribute("i"));
      const attributeNode = attributeNodes[i];
      if (attributeNode) {
        for (const [key, val] of Object.entries(attributeNode)) {
          node.setAttribute(key, val);
        }
      }
      node.removeAttribute("i");
    }

    for (const child of Array.from(node.childNodes)) {
      restoreAttributesRecursively(child, attributeNodes);
    }
  }
};
