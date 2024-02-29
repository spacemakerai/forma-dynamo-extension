export type Input = {
  id: string;
  name: string;
  type: string;
  value: string;
  nodeTypeProperties: {
    options: string[];
    minimumValue: number;
    maximumValue: number;
    stepValue: number;
  };
};
