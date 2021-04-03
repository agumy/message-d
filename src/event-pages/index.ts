type RequestMessage = {
  key: "requestTranslation";
  value: string;
  translationKey: string;
};

type CompletedTranslation = {
  key: "completedTranslation";
  value: string;
  translationKey: string;
};

const sha256 = async (text: string) => {
  const uint8 = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", uint8);
  return Array.from(new Uint8Array(digest))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
};

chrome.runtime.onMessage.addListener((message: RequestMessage) => {
  if (message.key !== "requestTranslation") {
    return;
  }

  chrome.tabs.query(
    { currentWindow: true, url: "https://www.deepl.com/*" },
    (tab) => {
      let deepL: chrome.tabs.Tab | null = null;

      if (tab.length && tab[0]) {
        deepL = tab[0];
      } else {
        chrome.tabs.create(
          { url: "https://www.deepl.com/translator", active: false },
          (tab) => {
            deepL = tab;
          }
        );
      }

      if (!deepL?.id) {
        return;
      }

      chrome.tabs.executeScript(
        deepL.id,
        {
          code: `
          (() => {
            const translatedTextArea = document.getElementById("target-dummydiv").innerHTML;
            const text = document.getElementsByClassName(
              "lmt__source_textarea"
            )[0].value;
            return [text, translatedTextArea]
          })()
        `,
        },
        async (res: Array<string[]>) => {
          if (!res[0] || !res[0][0] || !res[0][1]) {
            return;
          }

          const [origianl, translated] = res[0];
          const text = await sha256(origianl);
          console.log(text, message.translationKey);
          if (text === message.translationKey) {
            const m = {
              key: "completedTranslation",
              value: translated,
              translationKey: message.translationKey,
            };
            chrome.tabs.query({ active: true }, (tabs) => {
              if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, m);
              }
            });
          }
        }
      );

      chrome.tabs.executeScript(deepL.id, {
        code: `
        (() => {
          const observer = new MutationObserver((mutations, instance) => {
            for (const mutation of mutations) {
              const text = mutation.target.innerHTML
              console.log(text)
              const a = chrome.runtime.sendMessage("dmiahonigdkjdnfmndheoblcagpmnlgg", 
              { key: "completedTranslation",value: text, translationKey: "${message.translationKey}" })
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
    }
  );
});

chrome.runtime.onMessage.addListener((message: CompletedTranslation) => {
  if (message.key !== "completedTranslation") {
    return;
  }

  chrome.tabs.query({ active: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
});
