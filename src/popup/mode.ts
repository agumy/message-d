import * as mode from "../utils/storage/mode";

export const checkForRadio = async () => {
  const modeElements =
    document.querySelectorAll<HTMLInputElement>('[name="mode"]');

  const value = await mode.get();

  for (const e of Array.from(modeElements)) {
    e.checked = e.value === value;
    e.addEventListener("click", select);
  }
};

const select = async (e: MouseEvent) => {
  await mode.set((e.currentTarget as HTMLInputElement).value as mode.Mode);
};
