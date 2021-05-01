const htmlTagsNoTranslate = [
  "TITLE",
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "SVG",
  "CODE",
  "PRE",
];
const htmlTagsInlineIgnore = ["BR", "KBD", "WBR"];

const elements: Element[] = [];

const hasChildOnlyTextNode = (node: Node) =>
  node.childNodes.length &&
  Array.from(node.childNodes).every((node) => node.nodeType === 3);

const hasChildOnlyTextNodeRecursive = (
  node: Node,
  deps: number = 0
): boolean => {
  if (node instanceof Element && node.innerHTML.length > 1000) {
    return false;
  }

  if (node.nodeType === 3) {
    return true;
  }

  if (htmlTagsInlineIgnore.includes(node.nodeName.toUpperCase())) {
    return true;
  }

  if (deps === 2) {
    return false;
  }

  if (!node.childNodes.length) {
    return false;
  }

  if (hasChildOnlyTextNode(node)) {
    return true;
  }

  if (node instanceof Element && node.innerHTML.length < 250) {
    return true;
  }

  return Array.from(node.childNodes).every((node) =>
    hasChildOnlyTextNodeRecursive(node, deps + 1)
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
