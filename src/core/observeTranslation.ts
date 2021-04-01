const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    console.log((mutation.target as Element).innerHTML);
  }
});

export const observe = () => {
  const translatedTextArea = document.getElementById("target-dummydiv");
  if (!translatedTextArea) {
    throw new Error(`Not found DOM Node "target-dummydiv"`);
  }

  observer.observe(translatedTextArea, {
    attributes: false,
    childList: false,
    subtree: false,
  });
};
