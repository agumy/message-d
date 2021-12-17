import { createLoadingElement } from "../utils/createLoadingElement";
import { generateElementFromString } from "../utils/generateElementFromString";
import { getAllAtrributeRecursively } from "../utils/getAllAttributeRecursively";
import { getBoundingClientRectFlexibly } from "../utils/getBoundingClientRectFlexibly";
import { getInnerHTMLFlexibly } from "../utils/getInnerHTMLFlexibly";
import { removeAllAttributesRecursively } from "../utils/removeAllAttributesRecursively";
import { restoreAttributesRecursively } from "../utils/restoreAttributesRecursively";
import { sanitizeTranslatedHTML } from "../utils/sanitizeTranslatedHTML";
import { get as getMode } from "../utils/storage/mode";
import { unescapeHTML } from "../utils/unescapeHTML";
import {
  getAllTextNode,
  getAllTextNodeConsideringSelector,
} from "./getAllTextNode";

type TranslationTarget = {
  node: Element | Node;
  isTranslated: boolean;
};

const toTranslationTarget = (nodes: Node[]): TranslationTarget[] =>
  nodes.map((e) => ({
    isTranslated: false,
    node: e,
  }));

const fetchTranslation = async (values: string[]) => {
  const queries = new URLSearchParams();
  for (const value of values) {
    queries.append("q", value);
  }

  const res = await fetch("http://localhost:8080/translation", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      mode: "no-cors",
    },
    body: queries,
    mode: "cors",
  });

  return (await res.json()) as string[];
};

const translateInViewport = (allNodes: TranslationTarget[]) => {
  const targets = allNodes.filter((t, i) => {
    if (t.isTranslated) {
      return false;
    }

    const rect = getBoundingClientRectFlexibly(t.node);
    // Add a margin of 500px for anticipation.
    if (rect.top >= 0 && rect.top <= window.innerHeight + 500) {
      allNodes[i]!.isTranslated = true;
      return true;
    }

    return false;
  });

  if (targets.length) {
    // this is legacy logic
    // for (const t of targets) {
    // const temp = generateElementFromString(getInnerHTMLFlexibly(t.node));
    // sanitizeTranslatedHTML(temp);
    // const attribute = getAllAtrributeRecursively(temp);
    // removeAllAttributesRecursively(temp);

    //   const lineBreaked = temp.innerHTML.replaceAll(/\. /g, "$&\n");

    //   const loading = createLoadingElement();
    //   if (!document.querySelector("#message-d__loader-id")) {
    //     document.body.appendChild(loading);
    //   }
    //   fetchTranslation([lineBreaked]).then((translated) => {
    //     const escaped = unescapeHTML(translated[0]);

    //     const translatedHTML = generateElementFromString(escaped);
    //     sanitizeTranslatedHTML(translatedHTML);
    //     restoreAttributesRecursively(translatedHTML, attribute);

    //     if (t.node instanceof Element) {
    //       t.node.innerHTML = translatedHTML.innerHTML;
    //     } else {
    //       t.node.textContent = translatedHTML.innerHTML;
    //     }

    //     loading.remove();
    //   });
    // }
    const t = targets.map(({ node }) => {
      const temp = generateElementFromString(getInnerHTMLFlexibly(node));
      sanitizeTranslatedHTML(temp);
      removeAllAttributesRecursively(temp);
      const lineBreaked = temp.innerHTML.replaceAll(/\. /g, "$&\n");
      return {
        texts: lineBreaked,
        attributes: getAllAtrributeRecursively(temp),
      };
    });

    const loading = createLoadingElement();
    if (!document.querySelector("#message-d__loader-id")) {
      document.body.appendChild(loading);
    }

    fetchTranslation(t.map((e) => e.texts)).then((translated) => {
      translated.forEach((translatedText, i) => {
        const escaped = unescapeHTML(translatedText);

        const translatedHTML = generateElementFromString(escaped);
        sanitizeTranslatedHTML(translatedHTML);
        restoreAttributesRecursively(translatedHTML, t[i]!.attributes);
        const target = targets[i];
        if (target && target.node instanceof Element) {
          target.node.innerHTML = translatedHTML.innerHTML;
        }
      });

      loading.remove();
    });
  }

  setTimeout(() => translateInViewport(allNodes), 1000);
};

const selectTranslationTarget = async (event: KeyboardEvent): Promise<void> => {
  if (event.key !== "c" || !event.ctrlKey) {
    return;
  }

  const mode = await getMode();
  if (mode !== "api") {
    return;
  }

  let target: null | Element = null;

  const mousemove = (e: MouseEvent): void => {
    let x = e.clientX;
    let y = e.clientY;
    const newTarget = document.elementFromPoint(x, y);
    if (!target?.isEqualNode(newTarget)) {
      target?.classList.remove("message-d__translator");
      newTarget?.classList.add("message-d__translator");
      target = newTarget;
    }
  };

  const click = async (e: MouseEvent): Promise<void> => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    const currentTarget = document.elementFromPoint(e.clientX, e.clientY);

    if (!currentTarget) {
      return;
    }

    target?.classList.remove("message-d__translator");

    const loading = createLoadingElement();
    if (!document.querySelector("#message-d__loader-id")) {
      document.body.appendChild(loading);
    }

    const temp = generateElementFromString(currentTarget.innerHTML);
    sanitizeTranslatedHTML(temp);

    const attribute = getAllAtrributeRecursively(temp);
    removeAllAttributesRecursively(temp);

    const translationTarget = temp.innerHTML;
    const lineBreaked = translationTarget.replaceAll(/\. /g, "$&\n");
    const [translated] = await fetchTranslation([lineBreaked]);
    if (translated) {
      const escapedTranslated = unescapeHTML(translated);

      const translatedHTML = generateElementFromString(escapedTranslated);
      sanitizeTranslatedHTML(translatedHTML);

      restoreAttributesRecursively(translatedHTML, attribute);

      currentTarget.innerHTML = translatedHTML.innerHTML;
    }

    loading.remove();
  };

  const cancel = (event: KeyboardEvent): void => {
    if (event.key === "Escape" || (event.key === "c" && event.ctrlKey)) {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", cancel);
      document.addEventListener("keydown", selectTranslationTarget);

      const targets = document.querySelectorAll(".message-d__translator");
      targets.forEach((t) => {
        t.classList.remove("message-d__translator");
      });
    }
  };

  document.addEventListener("mousemove", mousemove);
  document.addEventListener("click", click, true);
  document.addEventListener("keydown", cancel);
  document.removeEventListener("keydown", selectTranslationTarget);
};

const translateStreamly = async (event: KeyboardEvent): Promise<void> => {
  if ((event.key !== "Q" && event.key !== "q") || !event.ctrlKey) {
    return;
  }

  const mode = await getMode();
  if (mode !== "api") {
    return;
  }

  if (event.shiftKey) {
    const allTargets = await getAllTextNodeConsideringSelector(document.body);
    const allNodes = toTranslationTarget(allTargets);

    translateInViewport(allNodes);
    return;
  }

  let target: null | Element = null;
  const mousemove = (e: MouseEvent): void => {
    let x = e.clientX;
    let y = e.clientY;
    const newTarget = document.elementFromPoint(x, y);
    if (!target?.isEqualNode(newTarget)) {
      target?.classList.remove("message-d__translator");
      newTarget?.classList.add("message-d__translator");
      target = newTarget;
    }
  };

  const click = async (e: MouseEvent): Promise<void> => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    const currentTarget = document.elementFromPoint(e.clientX, e.clientY);

    if (!currentTarget) {
      return;
    }

    target?.classList.remove("message-d__translator");

    // const allTargets = await getAllTextNodeConsideringSelector(currentTarget);
    const allTargets = await getAllTextNode(currentTarget);
    const allNodes = toTranslationTarget(allTargets);

    translateInViewport(allNodes);
  };

  const cancel = (event: KeyboardEvent): void => {
    if (event.key === "Escape" || (event.key === "q" && event.ctrlKey)) {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", cancel);
      document.addEventListener("keydown", translateStreamly);

      const targets = document.querySelectorAll(".message-d__translator");
      targets.forEach((t) => {
        t.classList.remove("message-d__translator");
      });
    }
  };

  document.addEventListener("mousemove", mousemove);
  document.addEventListener("click", click, true);
  document.addEventListener("keydown", cancel);
  document.removeEventListener("keydown", translateStreamly);
};

(async function initialize() {
  document.addEventListener("keydown", translateStreamly);
  document.addEventListener("keydown", selectTranslationTarget);
})();
