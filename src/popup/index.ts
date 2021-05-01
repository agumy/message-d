const createListItem = (value: string) => {
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

const ignore = (e: Event) => {
  e.preventDefault();
  const input = document.querySelector(".selector");
  const ul = document.querySelector(".ignore-list");

  if (
    !(input instanceof HTMLInputElement) ||
    !(ul instanceof HTMLUListElement)
  ) {
    return;
  }

  if (!input.value) {
    return;
  }

  const li = createListItem(input.value);
  ul.appendChild(li);

  const box = li.querySelector(".box")!;
  box.addEventListener("click", () => {
    input.focus();
    li.remove();
  });

  input.value = "";
  input.focus();
};

(() => {
  (document.querySelector(".selector") as HTMLInputElement).focus();
  const form = document.querySelector(".form")!;
  form.addEventListener("submit", ignore);
})();
