import { browser } from "webextension-polyfill-ts";
import { Complete, Request } from "../Messages";
import { sha256 } from "../utils/sha256";
import { unescapeHTML } from "../utils/unescapeHTML";

type Translation = {
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
    document.body.appendChild(loading);

    const translationTarget = currentTarget.innerHTML;
    const lineBreaked = translationTarget
      .replaceAll(/\. /g, "$&\n")
      .replaceAll(/<[a-zA-Z](.*?[^?])?>/g, "\n$&");

    const key = await sha256(lineBreaked);
    watingTranslation.push({
      translationKey: key,
      dom: currentTarget,
    });

    browser.runtime.sendMessage({
      key: "requestTranslation",
      value: lineBreaked,
      translationKey: key,
    } as Request);
  };

  const cancel = (event: KeyboardEvent): void => {
    if (event.key === "Escape" || (event.key === "c" && event.ctrlKey)) {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("click", click);
      document.removeEventListener("keydown", cancel);
      document.addEventListener("keydown", selectTranslationTarget);

      const targets = document.querySelectorAll(".message-d__translator");
      targets.forEach((t) => {
        t.classList.remove("message-d__translator");
      });
    }
  };

  document.addEventListener("mousemove", mousemove);
  document.addEventListener("click", click);
  document.addEventListener("keydown", cancel);
  document.removeEventListener("keydown", selectTranslationTarget);
};

(function initialize() {
  document.addEventListener("keydown", selectTranslationTarget);

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
    target.dom.innerHTML = `${unescapeHTML(message.value)}`;
  }

  watingTranslation = watingTranslation.filter(
    (e) => e.translationKey !== target?.translationKey
  );
  document.body.removeChild(document.getElementById("message-d__loader-id")!);
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
