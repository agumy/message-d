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

const hasChildOnlyTextNode = (node: Node) =>
  Boolean(node.childNodes.length) &&
  Array.from(node.childNodes).every((node) => node.nodeType === 3);

const hasChildOnlyTextNodeRecursive = (
  node: Node,
  deps: number = 0
): boolean => {
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

  return Array.from(node.childNodes).every((node) =>
    hasChildOnlyTextNodeRecursive(node, deps + 1)
  );
};

export const getAllTextNodeConsideringSelector = async (
  target: Element = document.body
) => {
  const elements: (Node | Element)[] = [];
  // console.log(target);
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
