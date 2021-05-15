export const generateElementFromString = (html: string) => {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp;
};
