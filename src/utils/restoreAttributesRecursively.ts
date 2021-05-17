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
      for (const [key, val] of Object.entries(attributeNodes[i]!)) {
        node.setAttribute(key, val);
      }
    }

    for (const child of Array.from(node.childNodes)) {
      restoreAttributesRecursively(child, attributeNodes);
    }
  }
};
