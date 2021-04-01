const translation = (event: KeyboardEvent) => {
  if (event.key !== "c" || !event.ctrlKey) {
    return;
  }

  const selection = window.getSelection()?.toString();
  if (!selection) {
    return;
  }

  chrome.runtime.sendMessage({ key: "requestTranslation", value: selection });
};

document.addEventListener("keydown", translation);
console.info(`message-d: loaded content scripts`);
