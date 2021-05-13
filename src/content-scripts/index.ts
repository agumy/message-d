import { browser } from "webextension-polyfill-ts";
import { Complete, Request } from "../Messages";
import { createLoadingElement } from "../utils/createLoadingElement";
import { getBoundingClientRectFlexibly } from "../utils/getBoundingClientRectFlexibly";
import { getInnerHTMLFlexibly } from "../utils/getInnerHTMLFlexibly";
import { sha256 } from "../utils/sha256";
import { get as getMode } from "../utils/storage/mode";
import { unescapeHTML } from "../utils/unescapeHTML";
import { waitAsync } from "../utils/waitAsync";
import { getAllTextNodeConsideringSelector } from "./getAllTextNode";

type Translation = {
  original: string;
  translationKey: string;
  dom: Node | Element;
};

type Cache = {
  content: string;
  dom: Node | Element;
};

let watingTranslation: Translation[] = [];
const cacheForUndo: Cache[] = [];
let cacheForRedo: Cache[] = [];

let isDoing: boolean = false;

const selectTranslationTarget = async (event: KeyboardEvent): Promise<void> => {
  if (event.key !== "c" || !event.ctrlKey) {
    return;
  }

  const mode = await getMode();
  if (mode !== "browser") {
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

    const key = await sha256(lineBreaked);
    watingTranslation.push({
      original: lineBreaked,
      translationKey: key,
      dom: currentTarget,
    });

    waitAsync(
      () => !isDoing,
      () => {
        isDoing = true;

        browser.runtime.sendMessage({
          key: "requestTranslation",
          value: watingTranslation[0]?.original,
          translationKey: watingTranslation[0]?.translationKey,
        } as Request);
      }
    );
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
  if (event.key !== "q" || !event.ctrlKey) {
    return;
  }

  const mode = await getMode();
  if (mode !== "browser") {
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
    const allNodes = allTargets
      .filter((element) => element.textContent?.trim())
      .map((e) => ({
        isTranslated: false,
        node: e,
      }));

    const translateInViewport = async () => {
      const targets = allNodes.filter((t, i) => {
        if (t.isTranslated) {
          return false;
        }

        const rect = getBoundingClientRectFlexibly(t.node);
        if (rect.top >= 0 && rect.top <= window.innerHeight) {
          allNodes[i]!.isTranslated = true;
          return true;
        }

        return false;
      });

      if (targets.length && !document.querySelector("#message-d__loader-id")) {
        const loading = createLoadingElement();
        document.body.appendChild(loading);
      }

      for (const target of targets) {
        const translationTarget = getInnerHTMLFlexibly(target.node);
        const lineBreaked = translationTarget.replaceAll(/\. /g, "$&\n");

        const key = await sha256(lineBreaked);
        watingTranslation.push({
          original: lineBreaked,
          translationKey: key,
          dom: target.node,
        });

        waitAsync(
          () => !isDoing,
          () => {
            if (!watingTranslation[0]) {
              return;
            }
            isDoing = true;
            browser.runtime.sendMessage({
              key: "requestTranslation",
              value: watingTranslation[0].original,
              translationKey: watingTranslation[0].translationKey,
            } as Request);
          }
        );
      }

      setTimeout(translateInViewport, 2000);
    };

    translateInViewport();
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
  document.addEventListener("keydown", selectTranslationTarget);
  document.addEventListener("keydown", translateStreamly);

  console.info(`[message-d] completed loading scripts`);
})();

// listener for message from event page
browser.runtime.onMessage.addListener((message: Complete) => {
  if (message.key !== "completedTranslation") {
    return;
  }

  const target = watingTranslation.find(
    (t) => t.translationKey === message.translationKey
  );

  if (target && message.value.trim()) {
    cacheForRedo = [];
    cacheForUndo.push({
      dom: target.dom,
      content: getInnerHTMLFlexibly(target.dom),
    });

    if (target.dom instanceof Element) {
      target.dom.innerHTML = `${unescapeHTML(message.value)}`;
    } else {
      target.dom.textContent = `${unescapeHTML(message.value)}`;
    }
  }

  watingTranslation = watingTranslation.filter(
    (e) => e.translationKey !== target?.translationKey
  );
  isDoing = false;

  if (!watingTranslation.length) {
    const loader = document.querySelector("#message-d__loader-id");
    if (loader) {
      document.body.removeChild(loader);
    }
  }
});

const undo = (event: KeyboardEvent): void => {
  if (event.key === "z" && event.ctrlKey) {
    const cache = cacheForUndo.pop();
    if (cache) {
      cacheForRedo.push({
        ...cache,
        content: getInnerHTMLFlexibly(cache.dom),
      });

      if (cache.dom instanceof Element) {
        cache.dom.innerHTML = `${unescapeHTML(cache.content)}`;
      } else {
        cache.dom.textContent = `${unescapeHTML(cache.content)}`;
      }
    }
  }
};

const redo = (event: KeyboardEvent): void => {
  if (event.key === "Z" && event.ctrlKey && event.shiftKey) {
    const cache = cacheForRedo.pop();
    if (cache) {
      cacheForUndo.push({
        ...cache,
        content: getInnerHTMLFlexibly(cache.dom),
      });

      if (cache.dom instanceof Element) {
        cache.dom.innerHTML = `${unescapeHTML(cache.content)}`;
      } else {
        cache.dom.textContent = `${unescapeHTML(cache.content)}`;
      }
    }
  }
};

document.addEventListener("keydown", undo);
document.addEventListener("keydown", redo);
