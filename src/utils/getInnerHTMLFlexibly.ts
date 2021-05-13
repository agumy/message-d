export const getInnerHTMLFlexibly = (node: Node | Element) => {
  if (node instanceof Element) {
    return node.innerHTML;
  }
  return node.textContent!;
};
