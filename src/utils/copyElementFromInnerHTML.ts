export const copyElementFromInnerHTML = (element: Element) => {
  const temp = document.createElement(element.tagName);
  temp.innerHTML = element.innerHTML;
  return temp;
};
