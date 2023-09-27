//const dynamoUrl = "https://app.dynaas-c-uw2.cloudos.autodesk.com/v1/graph";
const dynamoUrl = "http://localhost:55000/v1/graph";

export async function run(code, inputs) {
  try {
    const response = await fetch(dynamoUrl + "/run", {
      method: "POST",
      body: JSON.stringify({
        target: {
          type: "JsonGraphTarget",
          contents: JSON.stringify(code),
        },
        ignoreInputs: false,
        getImage: false,
        getGeometry: false,
        getContents: false,
        inputs: inputs,
      }),
    });

    return await response.json();
  } catch (e) {
    console.error(e);
  }
}
