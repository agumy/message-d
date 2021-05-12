import { browser } from "webextension-polyfill-ts";

type Mode = "api" | "browser";

export const getSelectorStorage = async (): Promise<Mode> => {
  const { mode } =
    ((await browser.storage.sync.get("mode")) as {
      mode: Mode;
    }) ?? ({ mode: "browser" } as const);

  return mode;
};

export const setToStorage = async (mode: Mode): Promise<void> => {
  await browser.storage.sync.set({
    mode,
  });
};
