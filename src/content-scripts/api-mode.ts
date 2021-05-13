import { createLoadingElement } from "../utils/createLoadingElement";
import { getBoundingClientRectFlexibly } from "../utils/getBoundingClientRectFlexibly";
import { getInnerHTMLFlexibly } from "../utils/getInnerHTMLFlexibly";
import { get as getMode } from "../utils/storage/mode";
import { unescapeHTML } from "../utils/unescapeHTML";
import { getAllTextNodeConsideringSelector } from "./getAllTextNode";

type TranslationTarget = {
  node: Element | Node;
  isTranslated: boolean;
};

const toTranslationTarget = (nodes: Node[]): TranslationTarget[] =>
  nodes
    .filter((element) => element.textContent?.trim())
    .map((e) => ({
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

  return await res.json();
};

const translateInViewport = async (allNodes: TranslationTarget[]) => {
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
    const loading = createLoadingElement();
    if (!document.querySelector("#message-d__loader-id")) {
      document.body.appendChild(loading);
    }

    const translateds = await fetchTranslation(
      targets.map((t) =>
        getInnerHTMLFlexibly(t.node).replaceAll(/\. /g, "$&\n")
      )
    );

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (target) {
        if (target.node instanceof Element) {
          target.node.innerHTML = `${unescapeHTML(translateds[i])}`;
        } else {
          target.node.textContent = `${unescapeHTML(translateds[i])}`;
        }
      }
    }

    loading.remove();
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

    const translationTarget = currentTarget.innerHTML;
    const lineBreaked = translationTarget.replaceAll(/\. /g, "$&\n");
    const translateds = await fetchTranslation([lineBreaked]);
    if (translateds[0]) {
      currentTarget.innerHTML = `${unescapeHTML(translateds[0])}`;
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

    const allTargets = await getAllTextNodeConsideringSelector(currentTarget);
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
