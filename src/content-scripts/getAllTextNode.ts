import { getSelectorStorage } from "../utils/storage/selector";

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

const hasChildOnlyTextNode = (node: Node): boolean => {
  if (node.childNodes.length) {
    return Array.from(node.childNodes).every(
      (node) => node.nodeType === 3 || hasChildOnlyTextNode(node)
    );
  }
  return false;
};

const hasChildOnlyTextNodeRecursive = (node: Node): boolean => {
  if (node.nodeType === 3 && (node.textContent ?? "").trim().length > 0) {
    return true;
  }

  if (htmlTagsInlineIgnore.includes(node.nodeName.toUpperCase())) {
    return true;
  }

  if (!node.childNodes.length) {
    return false;
  }

  if (
    hasChildOnlyTextNode(node) &&
    (node as Element).innerHTML.length <= 5000
  ) {
    return true;
  }

  return false;
};

export const getAllTextNodeConsideringSelector = async (
  target: Element = document.body
) => {
  const elements: (Node | Element)[] = [];

  const { selectors } = await getSelectorStorage();
  const joinedSelector = selectors.join(",");
  const ignoredElements = Array.from(target.querySelectorAll(joinedSelector));

  const getAllTextNode = (target: Node | Element): (Node | Element)[] => {
    const shouldPush = hasChildOnlyTextNodeRecursive(target);
    if (shouldPush) {
      elements.push(target);
    } else {
      for (const node of Array.from(target.childNodes)) {
        if (
          !htmlTagsNoTranslate.includes(node.nodeName.toUpperCase()) &&
          !ignoredElements.some((e) => e.isEqualNode(node))
        ) {
          getAllTextNode(node);
        }
      }
    }
    return elements;
  };

  return getAllTextNode(target);
};
