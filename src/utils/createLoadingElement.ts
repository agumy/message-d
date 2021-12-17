export const createLoadingElement = (): HTMLDivElement => {
  const loadingWrapper = document.createElement("div");
  loadingWrapper.classList.add("message-d__loading-wrapper");
  const loading = document.createElement("div");
  loading.classList.add("message-d__loader");
  loading.id = "message-d__loader-id";
  loadingWrapper.appendChild(loading);

  return loadingWrapper;
};
