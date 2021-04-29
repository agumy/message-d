const htmlTagsNoTranslate = ["TITLE", "SCRIPT", "STYLE", "TEXTAREA"];
const htmlTagsInlineIgnore = ["BR", "CODE", "KBD", "WBR", "PRE"];
const textNodes: Node[] = [];

export const geAllTextNode = (target: Node = document.body): Node[] => {
  if (
    htmlTagsNoTranslate.includes(target.nodeName) ||
    htmlTagsInlineIgnore.includes(target.nodeName)
  ) {
    // @ts-expect-error
    return;
  }

  for (const node of Array.from(target.childNodes)) {
    if (node.nodeType === 3 && node.textContent!.trim().length > 0) {
      textNodes.push(node);
    }

    if (node.hasChildNodes()) {
      for (const n of Array.from(node.childNodes)) {
        geAllTextNode(n);
      }
    }
  }

  return textNodes;
};
