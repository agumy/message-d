import { browser } from "webextension-polyfill-ts";
import { Complete, Request } from "../Messages";
import { sha256 } from "../utils/sha256";
import { get as getMode } from "../utils/storage/mode";
import { unescapeHTML } from "../utils/unescapeHTML";
import { waitAsync } from "../utils/waitAsync";
import { getAllTextNodeConsideringSelector } from "./getAllTextNode";

type Translation = {
  original: string;
  translationKey: string;
  dom: Element;
};

type Cache = {
  innerHTML: string;
  dom: Element;
};

let watingTranslation: Translation[] = [];
const cacheForUndo: Cache[] = [];
let cacheForRedo: Cache[] = [];

let isDoing: boolean = false;

const createLoadingElement = (): HTMLDivElement => {
  const loading = document.createElement("div");
  loading.classList.add("message-d__loader");
  loading.id = "message-d__loader-id";

  return loading;
};

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
  if (event.key !== "p" || !event.ctrlKey) {
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

        const rect = t.node.getBoundingClientRect();
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
        const translationTarget = target.node.innerHTML;
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
    if (event.key === "Escape" || (event.key === "p" && event.ctrlKey)) {
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
      innerHTML: target.dom.innerHTML,
    });
    target.dom.setAttribute("title", target.dom.textContent ?? "");
    target.dom.innerHTML = `${unescapeHTML(message.value)}`;
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
        innerHTML: cache.dom.innerHTML,
      });
      cache.dom.innerHTML = cache.innerHTML;
    }
  }
};

const redo = (event: KeyboardEvent): void => {
  if (event.key === "Z" && event.ctrlKey && event.shiftKey) {
    const cache = cacheForRedo.pop();
    if (cache) {
      cacheForUndo.push({
        ...cache,
        innerHTML: cache.dom.innerHTML,
      });
      cache.dom.innerHTML = cache.innerHTML;
    }
  }
};

document.addEventListener("keydown", undo);
document.addEventListener("keydown", redo);
