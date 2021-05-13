export const getBoundingClientRectFlexibly = (node: Node | Element) => {
  if (node instanceof Element) {
    return node.getBoundingClientRect();
  }
  const range = document.createRange();
  range.selectNode(node);
  return range.getBoundingClientRect();
};
