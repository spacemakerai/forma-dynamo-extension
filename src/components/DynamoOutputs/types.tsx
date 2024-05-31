export type Output = {
  id: string;
  type: "Watch3D" | "WatchImageCore" | string;
  name: string;
  value?: string[] | string | undefined;
};
