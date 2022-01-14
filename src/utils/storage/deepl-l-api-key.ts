import { browser } from "webextension-polyfill-ts";

export const get = async (): Promise<string> => {
  const { apiKey } = (await browser.storage.sync.get("apiKey")) as {
    apiKey: string;
  };

  if (!apiKey) {
    return "";
  }

  return apiKey;
};

export const set = async (apiKey: string): Promise<void> => {
  await browser.storage.sync.set({
    apiKey,
  });
};
