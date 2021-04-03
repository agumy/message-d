type ResponseMessage = {
  key: "completedTranslation";
  value: string;
  translationKey: string;
};

// @ts-ignore
const sha256 = async (text: string) => {
  const uint8 = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", uint8);
  return Array.from(new Uint8Array(digest))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
};

const unescapeHtml = (target: string) => {
  const patterns: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#x27;": "'",
    "&#x60;": "`",
  };

  return target.replace(/&(lt|gt|amp|quot|#x27|#x60);/g, (match) => {
    return patterns[match] ?? "";
  });
};

let watingTranslation: { key: string; dom: Element }[] = [];

const translation = async (event: KeyboardEvent) => {
  if (event.key !== "c" || !event.ctrlKey) {
    return;
  }

  let elm: null | Element = null;
  document.addEventListener("mousemove", (e) => {
    let x = e.clientX;
    let y = e.clientY;
    if (elm != document.elementFromPoint(x, y)) {
      try {
        elm?.classList.remove("message-d__translator");
      } catch {}
    }
    try {
      elm = document.elementFromPoint(x, y);
      elm?.classList.add("message-d__translator");
    } catch {}
  });

  document.addEventListener("click", async (e) => {
    e.preventDefault();
    let x = e.clientX;
    let y = e.clientY;
    elm = document.elementFromPoint(x, y);
    if (!elm) {
      return;
    }
    elm.classList.remove("message-d__translator");

    const loading = document.createElement("div");
    loading.classList.add("message-d__loader");
    loading.id = "message-d__loader-id";
    document.body.appendChild(loading);

    const key = await sha256(elm.innerHTML);
    watingTranslation.push({
      key,
      dom: elm,
    });

    chrome.runtime.sendMessage({
      key: "requestTranslation",
      value: elm.innerHTML,
      translationKey: key,
    });
  });
};

chrome.runtime.onMessage.addListener((message: ResponseMessage) => {
  if (message.key !== "completedTranslation") {
    return;
  }

  const target = watingTranslation.find(
    (t) => t.key === message.translationKey
  );

  if (!target) {
    return;
  }

  if (!message.value.trim()) {
    document.body.removeChild(document.getElementById("message-d__loader-id")!);
    watingTranslation = watingTranslation.filter((e) => e.key !== target.key);
    return;
  }

  target.dom.innerHTML = `${unescapeHtml(message.value)}`;
  watingTranslation = watingTranslation.filter((e) => e.key !== target.key);
  document.body.removeChild(document.getElementById("message-d__loader-id")!);
});

document.addEventListener("keydown", translation);
console.info(`message-d: loaded content scripts`);
