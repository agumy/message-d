export const createLoadingElement = (): HTMLDivElement => {
  const loading = document.createElement("div");
  loading.classList.add("message-d__loader");
  loading.id = "message-d__loader-id";

  return loading;
};
