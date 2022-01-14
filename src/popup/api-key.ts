import * as key from "../utils/storage/deepl-l-api-key";

export const checkForKey = async () => {
  const element = document.querySelector<HTMLInputElement>(".api-key");

  const value = await key.get();

  if (element) {
    element.value = value;
    element.addEventListener("change", (e) => {
      key.set((e.currentTarget as HTMLInputElement).value);
    });
  }
};
