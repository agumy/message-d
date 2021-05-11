import { unescapeHTML } from "../utils/unescapeHTML";
import { getAllTextNodeConsideringSelector } from "./getAllTextNode";

type TranslationTarget = {
  node: Element;
  isTranslated: boolean;
};

const toTranslationTarget = (nodes: Element[]) =>
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

const createLoadingElement = (): HTMLDivElement => {
  const loading = document.createElement("div");
  loading.classList.add("message-d__loader");
  loading.id = "message-d__loader-id";

  return loading;
};

const translateInViewport = async (allNodes: TranslationTarget[]) => {
  const targets = allNodes.filter((t, i) => {
    if (t.isTranslated) {
      return false;
    }

    const rect = t.node.getBoundingClientRect();
    if (rect.top >= 0 && rect.top <= window.innerHeight) {
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
      targets.map((t) => t.node.innerHTML.replaceAll(/\. /g, "$&\n"))
    );

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (target) {
        target.node.innerHTML = `${unescapeHTML(translateds[i])}`;
      }
    }

    loading.remove();
  }

  setTimeout(() => translateInViewport(allNodes), 2000);
};

const translateStreamly = async (event: KeyboardEvent): Promise<void> => {
  if ((event.key !== "Q" && event.key !== "q") || !event.ctrlKey) {
    return;
  }
  console.log(event);
  if (event.shiftKey) {
    console.log("test");
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
})();
