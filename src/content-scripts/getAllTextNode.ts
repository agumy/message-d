const htmlTagsNoTranslate = ["TITLE", "SCRIPT", "STYLE", "TEXTAREA", "SVG"];
const htmlTagsInlineIgnore = ["BR", "CODE", "KBD", "WBR", "PRE"];
// const textNodes: Node[] = [];
const elements: Element[] = [];

// export const geAllTextNode = (target: Node = document.body): Node[] => {
//   if (
//     htmlTagsNoTranslate.includes(target.nodeName) ||
//     htmlTagsInlineIgnore.includes(target.nodeName)
//   ) {
//     // @ts-expect-error
//     return;
//   }

//   for (const node of Array.from(target.childNodes)) {
//     if (node.nodeType === 3 && node.textContent!.trim().length > 0) {
//       textNodes.push(node);
//     }

//     if (node.hasChildNodes()) {
//       for (const n of Array.from(node.childNodes)) {
//         geAllTextNode(n);
//       }
//     }
//   }

//   return textNodes;
// };

const hasChildOnlyTextNode = (node: Node) =>
  node.childNodes.length &&
  Array.from(node.childNodes).every((node) => node.nodeType === 3);

const hasChildOnlyTextNodeRecursive = (node: Node): boolean => {
  if (node.nodeType === 3) {
    return true;
  }

  if (!node.childNodes.length) {
    return false;
  }

  if (hasChildOnlyTextNode(node)) {
    return true;
  }

  return Array.from(node.childNodes).every((node) =>
    hasChildOnlyTextNodeRecursive(node)
  );
};

export const getAllTextNode = (target: Element = document.body): Element[] => {
  const shouldPush = hasChildOnlyTextNodeRecursive(target);
  if (shouldPush) {
    elements.push(target);
  } else {
    for (const node of Array.from(target.childNodes)) {
      if (
        node.nodeType === 1 &&
        !htmlTagsNoTranslate.includes(node.nodeName.toUpperCase())
      ) {
        getAllTextNode(node as Element);
      }
    }
  }
  return elements;
};