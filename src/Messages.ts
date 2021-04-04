export type Complete = {
  key: "completedTranslation";
  value: string;
  translationKey: string;
  tabId: string;
};

export type Request = {
  key: "requestTranslation";
  value: string;
  translationKey: string;
};
