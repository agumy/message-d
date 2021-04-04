import { sha256 } from "../core/sha256";
import { unescapeHTML } from "../core/unescapeHTML";
import { Complete, Request } from "../core/Messages";

type Translation = {
  translationKey: string;
  dom: Element;
};

let watingTranslation: Translation[] = [];

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
    e.preventDefault();

    const currentTarget = document.elementFromPoint(e.clientX, e.clientY);

    if (!currentTarget) {
      return;
    }

    target?.classList.remove("message-d__translator");

    const loading = createLoadingElement();
    document.body.appendChild(loading);

    const translationTarget = currentTarget.innerHTML;
    const key = await sha256(translationTarget);
    watingTranslation.push({
      translationKey: key,
      dom: currentTarget,
    });

    chrome.runtime.sendMessage({
      key: "requestTranslation",
      value: translationTarget,
      translationKey: key,
    } as Request);
  };

  const cancel = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("click", click);
      document.removeEventListener("keydown", cancel);

      const targets = document.querySelectorAll(".message-d__translator");
      targets.forEach((t) => {
        t.classList.remove("message-d__translator");
      });
    }
  };

  document.addEventListener("mousemove", mousemove);
  document.addEventListener("click", click);
  document.addEventListener("keydown", cancel);
};

(function initialize() {
  document.addEventListener("keydown", selectTranslationTarget);

  console.info(`[message-d] completed loading scripts`);
})();

// listener for message from event page
chrome.runtime.onMessage.addListener((message: Complete) => {
  if (message.key !== "completedTranslation") {
    return;
  }

  const target = watingTranslation.find(
    (t) => t.translationKey === message.translationKey
  );

  if (target && message.value.trim()) {
    target.dom.innerHTML = `${unescapeHTML(message.value)}`;
  }

  watingTranslation = watingTranslation.filter(
    (e) => e.translationKey !== target?.translationKey
  );
  document.body.removeChild(document.getElementById("message-d__loader-id")!);
});
