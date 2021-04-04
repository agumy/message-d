import { Tabs, browser } from "webextension-polyfill-ts";
import { sha256 } from "../core/sha256";
import { Complete, Request } from "../core/Messages";

browser.runtime.onMessage.addListener(async (message: Request) => {
  if (message.key !== "requestTranslation") {
    return;
  }

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  let deepL: Tabs.Tab | null = null;

  const tabs = await browser.tabs.query({
    currentWindow: true,
    url: "https://www.deepl.com/translator*",
  });

  if (tabs[0]) {
    deepL = tabs[0];
  } else {
    deepL = await browser.tabs.create({
      url: "https://www.deepl.com/translator",
      active: false,
      pinned: true,
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
  }

  const res = await browser.tabs.executeScript(deepL.id, {
    code: `
    (() => {
      const translatedTextArea = document.getElementById("target-dummydiv").innerHTML;
      const text = document.getElementsByClassName(
        "lmt__source_textarea"
      )[0].value;
      return [text, translatedTextArea]
    })()
    `,
  });

  if (!res[0] || !res[0][0] || !res[0][1]) {
    return;
  }

  const [origianl, translated] = res[0];
  const text = await sha256(origianl);

  if (text === message.translationKey) {
    const m = {
      key: "completedTranslation",
      value: translated,
      translationKey: message.translationKey,
      tabId: String(tab.id),
    } as Complete;
    browser.tabs.sendMessage(Number(tab.id), m);
    return;
  }

  browser.tabs.executeScript(deepL.id, {
    code: `
    (() => {
      const observer = new MutationObserver((mutations, instance) => {
        for (const mutation of mutations) {
          const text = mutation.target.innerHTML
          chrome.runtime.sendMessage("dmiahonigdkjdnfmndheoblcagpmnlgg", 
          { key: "completedTranslation",value: text, translationKey: "${message.translationKey}", tabId: "${tab.id}" })
          instance.disconnect();
        }
      });
      
      const translatedTextArea = document.getElementById("target-dummydiv");
      if (!translatedTextArea) {
        throw new Error('Not found DOM Node "target-dummydiv"');
      }
    
      observer.observe(translatedTextArea, {
        attributes: false,
        childList: true,
        characterdata: true,
        subtree: false,
      });
      
      const text = document.getElementsByClassName(
        "lmt__source_textarea"
      )[0]

      text.value = \`${message.value}\`;
      text.dispatchEvent(new KeyboardEvent("input"));
    })();
    `,
  });
});

browser.runtime.onMessage.addListener(({ tabId, ...message }: Complete) => {
  if (message.key !== "completedTranslation") {
    return;
  }

  browser.tabs.sendMessage(Number(tabId), message);
});
