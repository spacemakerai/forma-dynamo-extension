import { Forma } from "forma-embedded-view-sdk/auto";
import { Template } from "forma-embedded-view-sdk/dist/internal/experimental/housing";
import { useEffect, useState } from "preact/hooks";
import { Input } from "./types";

export function Housing({
  input,
  value,
  setValue,
}: {
  input: Input;
  value: any;
  setValue: (id: string, v: any) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  useEffect(() => {
    (async () => {
      const templates = await Forma.experimental.housing.listTemplates();

      setTemplates(templates);

      setValue(input.id, templates[0].templateId);
    })();
  }, [input.id, setValue]);

  return (
    <div>
      <forma-select-native
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.detail.value)}
        value={value}
      >
        {templates.map(({ templateId, name }) => (
          <option value={templateId} key={templateId}>
            {name}
          </option>
        ))}
      </forma-select-native>
    </div>
  );
}
