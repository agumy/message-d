import { browser } from "webextension-polyfill-ts";

export const getSelectorStorage = async () => {
  const storage = ((await browser.storage.sync.get("selectors")) as {
    selectors: string[];
  }) ?? {
    selectors: [],
  };

  return storage;
};

export const setToStorage = async (value: string) => {
  const storage = await getSelectorStorage();

  await browser.storage.sync.set({
    selectors: Array.from(new Set([...storage.selectors, value])),
  });

  Promise.resolve();
};

export const removeFromStorage = async (value: string) => {
  const storage = await getSelectorStorage();
  await browser.storage.sync.set({
    selectors: [...storage.selectors].filter((e) => e !== value),
  });
};
