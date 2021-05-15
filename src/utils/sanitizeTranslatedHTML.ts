export const sanitizeTranslatedHTML = (node: Node) => {
  if (
    node instanceof Text &&
    (node.nodeValue?.trim() === "。" || !node.nodeValue?.trim().length)
  ) {
    node.remove();
  }
  for (const child of Array.from(node.childNodes)) {
    sanitizeTranslatedHTML(child);
  }
};
