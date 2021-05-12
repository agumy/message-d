import { browser } from "webextension-polyfill-ts";

export type Mode = "api" | "browser";

export const get = async (): Promise<Mode> => {
  const { mode } =
    ((await browser.storage.sync.get("mode")) as {
      mode: Mode;
    }) ?? ({ mode: "browser" } as const);

  return mode;
};

export const set = async (mode: Mode): Promise<void> => {
  await browser.storage.sync.set({
    mode,
  });
};
