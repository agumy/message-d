type RequestMessage = {
  key: "request";
  value: string;
};

chrome.runtime.onMessage.addListener((message: RequestMessage) => {
  if (message.key !== "request") {
    return;
  }

  console.log(message.value);
});
