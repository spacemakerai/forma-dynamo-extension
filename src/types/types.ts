export type JSONGraph = {
  type: "JSON";
  id: string;
  name: string;
  graph?: any;
};

export type UnSavedGraph = {
  type: "UNSAVED";
  id: string;
  name: string;
  graph: any;
};
