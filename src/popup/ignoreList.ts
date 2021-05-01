import { getSelectorStorage, removeFromStorage } from "../utils/storage";

export const createListItem = (value: string) => {
  const li = document.createElement("li");
  li.classList.add("list-item");

  const selector = document.createElement("span");
  selector.textContent = value;
  li.appendChild(selector);

  const box = document.createElement("div");
  box.classList.add("box");
  li.appendChild(box);

  const deleteButton = document.createElement("span");
  deleteButton.classList.add("dli-close");
  box.appendChild(deleteButton);

  return li;
};

export const getIgnoreList = () => {
  const ul = document.querySelector(".ignore-list")!;
  return ul as HTMLUListElement;
};

const removeAllItem = () => {
  const ul = getIgnoreList();
  for (const item of Array.from(ul.childNodes)) {
    ul.removeChild(item);
  }
};

export const buildIgnoreList = async () => {
  const storage = await getSelectorStorage();
  removeAllItem();

  const ul = getIgnoreList();
  for (const selector of storage.selectors) {
    const li = createListItem(selector);
    ul.appendChild(li);

    const box = li.querySelector(".box")!;
    box.addEventListener("click", async () => {
      removeFromStorage(selector);
      li.remove();
    });
  }
};
