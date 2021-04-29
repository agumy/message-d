export const waitAsync = (
  conditionCallback: () => any,
  callback: () => any,
  intervalMillSecond = 100
): void => {
  if (conditionCallback()) {
    callback();
    return;
  }
  const intervalId = setInterval(() => {
    if (!conditionCallback()) {
      return;
    }
    clearInterval(intervalId);
    callback();
  }, intervalMillSecond);
};
