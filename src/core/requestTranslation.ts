export const requestTranslation = (word: string) => {
  const text = document.getElementsByClassName(
    "lmt__source_textarea"
  )[0] as HTMLTextAreaElement | null;

  if (!text) {
    throw new Error(`Not found DOM Node "lmt__source_textarea"`);
  }

  text.value = word;
  text.dispatchEvent(new KeyboardEvent("input"));
};
