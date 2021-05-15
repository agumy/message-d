import { unescapeHTML } from "../utils/unescapeHTML";

const storeDOMToTemp = (node: Node) => {
  if (node instanceof Element) {
    const html = node.innerHTML;
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp;
  }
  return node;
};

const removeAttributes = (node: Node) => {
  if (node instanceof Element) {
    while (node.hasAttributes()) {
      for (const attr of Array.from(node.attributes)) {
        node.removeAttribute(attr.name);
      }
    }

    for (const child of Array.from(node.children)) {
      removeAttributes(child);
    }
  }
};

// tests
const useCase = (node: Node) => {
  const temp = storeDOMToTemp(node);
  removeAttributes(temp);
  console.log(temp);
};

type Attributes = {
  attribute: Record<string, string>;
  children: Attributes[];
};

function getAllAtrributeRec(node: Node) {
  const attributes: Attributes[] = [];

  const getAllAttr = (node: Node, arr: Attributes[] = attributes) => {
    const el = {
      attribute: {} as Record<string, string>,
      children: [] as Attributes[],
    };

    if (node instanceof Element) {
      for (const attr of Array.from(node.attributes)) {
        el.attribute[attr.name] = attr.value;
      }

      arr.push(el);
      if (node.childNodes.length) {
        for (const c of Array.from(node.childNodes)) {
          getAllAttr(c, el.children);
        }
      }
    }
  };

  getAllAttr(node);
  return attributes;
}

const resotreAttributesCir = (translated: string, attributes: Attributes) => {
  const temp = document.createElement("div");
  temp.innerHTML = `${unescapeHTML(translated)}`;

  const restoreAttr = (node: Node | null, attribute: Attributes) => {
    if (node && node instanceof Element) {
      for (const [key, val] of Object.entries(attribute.attribute)) {
        node.setAttribute(key, val);
      }

      for (const [index, value] of Object.entries(node.children)) {
        restoreAttr(value, attribute.children[Number(index)]!);
      }
    }
  };

  restoreAttr(temp.firstChild, attributes);
  return temp;
};
