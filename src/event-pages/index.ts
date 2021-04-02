type RequestMessage = {
  key: "requestTranslation";
  value: string;
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
          const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              console.log(mutation.target.innerHTML);
              // chrome.runtime.sendMessage({ key: "aaa", value: "testestestestestestes" });
            }
          });
          
          const translatedTextArea = document.getElementById("target-dummydiv");
          if (!translatedTextArea) {
            throw new Error('Not found DOM Node "target-dummydiv"');
          }
        
          observer.observe(translatedTextArea, {
            attributes: false,
            childList: true,
            subtree: false,
          });

          
          const text = document.getElementsByClassName(
            "lmt__source_textarea"
          )[0]

          text.value = "${message.value}";
          text.dispatchEvent(new KeyboardEvent("input"));
        })();
        `,
        },
        (doc: any) => {
          console.log(doc);
        }
      );
    }
  );
});
