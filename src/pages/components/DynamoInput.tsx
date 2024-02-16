import { useEffect, useState } from "preact/hooks";
import { isSelect } from "../../utils/node";
import { Forma } from "forma-embedded-view-sdk/auto";
import { Template } from "forma-embedded-view-sdk/dist/internal/experimental/housing";
import { ElementResponse } from "forma-embedded-view-sdk/dist/internal/elements";
import { FormaElement } from "forma-elements";

function DynamoHousingTemplateInputComponent({
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

function addPaths(
  elements: ElementResponse,
  urn: string,
  path: string = "root",
): { [path: string]: FormaElement } {
  let elementsWithPath: { [path: string]: FormaElement } = { [path]: elements[urn] };

  for (const child of elements[urn].children || []) {
    elementsWithPath = {
      ...elementsWithPath,
      ...addPaths(elements, child.urn, `${path}/${child.key}`),
    };
  }

  return elementsWithPath;
}

function getPaths(elements: { [path: string]: FormaElement }, property: string, value: string) {
  const paths = [];
  for (const [path, element] of Object.entries(elements)) {
    if (element.properties?.[property] === value) {
      paths.push(path);
    }
  }

  return paths;
}

function GetElementsByPropertyInputComponent({
  input,
  value,
  setValue,
}: {
  input: Input;
  value: any;
  setValue: (id: string, v: any) => void;
}) {
  const [elements, setElements] = useState<{ [path: string]: FormaElement }>({});
  const [properties, setProperties] = useState<Record<string, Set<unknown>>>({});
  const [property, setProperty] = useState<string>("");
  useEffect(() => {
    (async () => {
      try {
        const urn = await Forma.proposal.getRootUrn();
        const response = await Forma.elements.get({
          urn,
          recursive: true,
        });

        const { elements } = response;

        setElements(addPaths(elements, urn));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [input.id]);

  useEffect(() => {
    const properties: Record<string, Set<unknown>> = {};
    (async () => {
      Object.values(elements).forEach((element) => {
        Object.entries(element.properties || {}).map(([key, value]) => {
          if (properties[key]) {
            properties[key].add(value);
          } else {
            properties[key] = new Set<unknown>();
          }
        });
      });

      setProperties(properties);
      setProperty(Object.keys(properties)[0]);
    })();
  }, [elements]);

  return (
    <div>
      Property
      {Object.keys(properties).length === 0 ? (
        <span>No properties</span>
      ) : (
        <>
          <forma-select-native
            // @ts-ignore
            onChange={(ev) => setProperty(ev.detail.value)}
            value={value}
          >
            {Object.keys(properties)
              .sort()
              .map((name) => (
                <option value={name} key={name}>
                  {name}
                </option>
              ))}
          </forma-select-native>

          <forma-select-native
            // @ts-ignore
            onChange={(ev) => setValue(input.id, getPaths(elements, property, ev.detail.value))}
            value={value}
          >
            {[...properties[property]].map((name) => (
              <option value={String(name)} key={name}>
                {String(name)}
              </option>
            ))}
          </forma-select-native>
        </>
      )}
    </div>
  );
}

function DynamoInputComponent({
  input,
  value,
  setValue,
  setActiveSelectionNode,
}: {
  input: Input;
  value: any;
  setValue: (id: string, v: any) => void;
  setActiveSelectionNode?: (v: any) => void;
}) {
  if (input.type === "FormaTerrain") {
    return null;
  } else if (input.type === "FormaProject") {
    return null;
  } else if (input.type === "FormaHousingTemplate") {
    return <DynamoHousingTemplateInputComponent input={input} value={value} setValue={setValue} />;
  } else if (isSelect(input)) {
    return (
      <div>
        {value && <span>{value.length} Selected</span>}
        <weave-button
          style={{ marginLeft: "5px" }}
          variant="outlined"
          onClick={() => setActiveSelectionNode?.({ id: input.id, name: input.name })}
        >
          Select
        </weave-button>
      </div>
    );
  } else if (input.type === "FormaGetElementsByProperty") {
    return <GetElementsByPropertyInputComponent input={input} value={value} setValue={setValue} />;
  } else if (input.type === "StringInput") {
    return (
      <weave-input
        type="text"
        value={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else if (input.type === "BoolSelector") {
    return (
      <weave-checkbox checked={value} onChange={(ev) => setValue(input.id, ev.detail.checked)} />
    );
  } else if (input.type === "DoubleSlider") {
    return (
      <>
        <weave-slider
          min={input.nodeTypeProperties.minimumValue}
          max={input.nodeTypeProperties.maximumValue}
          step={input.nodeTypeProperties.stepValue}
          value={value}
          onInput={(ev) => setValue(input.id, ev.detail)}
        />
        <span>{value}</span>
      </>
    );
  } else if (input.type === "IntegerSlider64Bit") {
    return (
      <>
        <weave-slider
          min={input.nodeTypeProperties.minimumValue}
          max={input.nodeTypeProperties.maximumValue}
          step={input.nodeTypeProperties.stepValue}
          value={value}
          onInput={(ev) => setValue(input.id, ev.detail)}
        />
        <span>{value}</span>
      </>
    );
  } else if (input.type === "DoubleInput") {
    return (
      <weave-input
        type="number"
        value={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else if (input.type === "DSDropDownBase" || input.type === "CustomSelection") {
    return (
      <forma-select-native
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.detail.value)}
        value={value}
      >
        {input.nodeTypeProperties.options.map((name: string, i) => (
          <option value={i} key={i}>
            {name}
          </option>
        ))}
      </forma-select-native>
    );
  } else if (input.type === "Filename") {
    return (
      <weave-input
        type="text"
        value={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else if (input.type === "Directory") {
    return (
      <weave-input
        type="text"
        value={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  }
  return null;
}

type Input = {
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

export function DynamoInput({ code, state, setValue, setActiveSelectionNode }: any) {
  return (
    <div>
      <div
        style={{
          padding: "5px",
          backgroundColor: "var(--background-filled-level100to250-default)",
          borderBottom: "1px solid var(--divider-lightweight)",
          borderTop: "1px solid var(--divider-lightweight)",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        Inputs
      </div>

      {(code?.inputs || []).map((input: Input) => (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 0 5px 5px",
            lineHeight: "24px",
            borderBottom: "1px solid var(--divider-lightweight)",
          }}
          key={input.id}
        >
          {input.name}
          <DynamoInputComponent
            input={input}
            value={state[input.id]}
            setValue={setValue}
            setActiveSelectionNode={setActiveSelectionNode}
          />
        </div>
      ))}

      {code?.inputs?.length === 0 && (
        <div
          style={{
            padding: "5px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>No inputs</span>
          <weave-button
            variant="flat"
            onClick={() =>
              window.open(
                "https://help.autodeskforma.com/en/articles/8560252-dynamo-player-extension-for-forma-beta#h_163069ec88",
                "_blank",
              )
            }
          >
            Learn how
          </weave-button>
        </div>
      )}
    </div>
  );
}
