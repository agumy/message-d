export const unescapeHTML = (target: string) => {
  const patterns: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#x27;": "'",
    "&#x60;": "`",
  };

  return target.replace(/&(lt|gt|amp|quot|#x27|#x60);/g, (match) => {
    return patterns[match] ?? "";
  });
};
