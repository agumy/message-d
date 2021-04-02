const sha256 = async (text: string) => {
  const uint8 = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", uint8);
  return Array.from(new Uint8Array(digest))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
};

const watingTranslation = [];

const translation = async (event: KeyboardEvent) => {
  if (event.key !== "c" || !event.ctrlKey) {
    return;
  }

  const selection = window.getSelection()?.toString();

  if (!selection) {
    return;
  }

  const selectionDOM = window.getSelection()?.getRangeAt(0).cloneContents();

  if (!selectionDOM) {
    return;
  }

  const key = await sha256(selection);
  watingTranslation.push({
    key,
    dom: selectionDOM,
  });

  chrome.runtime.sendMessage({ key: "requestTranslation", value: selection });
};

document.addEventListener("keydown", translation);
console.info(`message-d: loaded content scripts`);
