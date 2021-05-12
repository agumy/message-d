import { setToStorage } from "../utils/storage/selector";
import { buildIgnoreList } from "./ignoreList";
import { checkForRadio } from "./mode";

const ignore = async (e: Event) => {
  e.preventDefault();
  const input = document.querySelector(".selector") as HTMLInputElement;

  if (!input.value) {
    return;
  }

  await setToStorage(input.value);
  buildIgnoreList();

  input.value = "";
  input.focus();
};

(() => {
  const form = document.querySelector(".form")!;
  form.addEventListener("submit", ignore);
  buildIgnoreList();
  checkForRadio();
  (document.querySelector(".selector") as HTMLInputElement).focus();
})();
