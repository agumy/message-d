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
      (node) =>
        node.nodeType === 3 ||
        hasChildOnlyTextNode(node) ||
        htmlTagsInlineIgnore.includes(node.nodeName.toUpperCase())
    );
  }
  return false;
};

const hasChildOnlyTextNodeRecursive = (node: Node): boolean => {
  if (node.nodeType === 3 && (node.textContent ?? "").trim().length > 0) {
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

/**
 * @deprecated this is legacy api
 */
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

const includesTextNode = (node: Node): boolean => {
  return Array.from(node.childNodes).some(
    (node) => node.nodeType === 3 && (node.textContent ?? "").trim().length > 0
  );
};

// --テキストノードのみ
export const getAllTextNode = async (target: Element = document.body) => {
  const elements: (Node | Element)[] = [];

  const { selectors } = await getSelectorStorage();
  const joinedSelector = selectors.join(",");
  const ignoredElements = Array.from(target.querySelectorAll(joinedSelector));

  const getAllTextNode = (target: Node | Element) => {
    const shouldPush = includesTextNode(target);
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
