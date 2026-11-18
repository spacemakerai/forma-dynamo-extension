import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { URL } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Compile the actual TS/TSX modules with mocked imports so the tests need no browser or network.
function loadModule(path, imports, globals = {}, exposeCreateBasicElement = false) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const testExport = exposeCreateBasicElement
    ? "\nexport { createBasicElement as __testCreateBasicElement };\n"
    : "";
  const compiled = ts.transpileModule(source + testExport, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: "preact",
      esModuleInterop: true,
    },
    fileName: path,
  }).outputText;
  const module = { exports: {} };
  const require = (name) => {
    if (!Object.hasOwn(imports, name)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  };
  runInNewContext(compiled, { module, exports: module.exports, require, URL, ...globals });
  return module.exports;
}

function loadAps(Forma) {
  return loadModule("../src/util/aps.ts", { "forma-embedded-view-sdk/auto": { Forma } });
}

const globalBaseUrl = "https://api.aps.autodesk.com";
const legacyHost = "https://developer.api.autodesk.com";
const regions = ["gbr", "can", "deu", "ind", "jpn", "stg.ind"];
const regionalBaseUrl = (region) => `https://api.aps.${region}.autodesk.com`;

// Header expectations (regional hosts omit X-Ads-Region, the global fallback sends EMEA) are the
// current/preserved behavior pending platform confirmation, not a settled contract.
function assertMapping(origin, baseUrl) {
  const aps = loadAps({ origin });
  const actualBaseUrl = aps.getApsBaseUrl();
  assert.equal(actualBaseUrl, baseUrl);
  assert.ok(!actualBaseUrl.includes("developer.api.autodesk.com"));
  const headers = aps.getApsRegionHeaders();
  if (baseUrl === globalBaseUrl) {
    assert.deepEqual({ ...headers }, { "X-Ads-Region": "EMEA" });
  } else {
    assert.deepEqual({ ...headers }, {});
  }
}

const regionalCases = [];
for (const region of regions) {
  for (const product of ["forma", "formadesign"]) {
    for (const prefix of ["", "local."]) {
      regionalCases.push({
        origin: `https://${prefix}${product}.${region}.autodesk.com`,
        baseUrl: regionalBaseUrl(region),
      });
    }
  }
}
regionalCases.push(
  // Hostnames are case-insensitive and ports/paths/credentials are ignored.
  { origin: "https://FORMA.GBR.AUTODESK.COM", baseUrl: regionalBaseUrl("gbr") },
  { origin: "https://Local.FormaDesign.Stg.Ind.Autodesk.com", baseUrl: regionalBaseUrl("stg.ind") },
  { origin: "https://forma.can.autodesk.com:8443", baseUrl: regionalBaseUrl("can") },
  { origin: "https://local.formadesign.deu.autodesk.com:3000/", baseUrl: regionalBaseUrl("deu") },
  { origin: "https://forma.jpn.autodesk.com/some/path?q=1#hash", baseUrl: regionalBaseUrl("jpn") },
  { origin: "https://user:pass@forma.ind.autodesk.com", baseUrl: regionalBaseUrl("ind") },
);

for (const { origin, baseUrl } of regionalCases) {
  test(`regional hosts omit X-Ads-Region (current behavior, pending platform confirmation): ${origin}`, () => {
    assertMapping(origin, baseUrl);
  });
}

// Staging/dev origins intentionally fall back to global production (SDK selector parity). No
// modern global staging host exists, so none is invented. stg.ind stays regional (see above).
const stagingDevOrigins = [
  "https://forma.stg.usa.autodesk.com",
  "https://formadesign.stg-usa.autodesk.com",
  "https://forma.test.autodesk.com",
  "https://forma.dev.autodesk.com",
];

for (const origin of stagingDevOrigins) {
  test(`staging/dev origins fall back to global production (SDK parity; no modern staging host): ${origin}`, () => {
    assertMapping(origin, globalBaseUrl);
  });
}

const globalFallbackOrigins = [
  // Global and non-regional Forma hosts.
  "https://forma.autodesk.com",
  "https://formadesign.autodesk.com",
  "https://local.forma.autodesk.com",
  "https://app.autodeskforma.eu",
  "https://app.autodeskforma.com",
  "https://localhost:3000",
  // Unknown region.
  "https://forma.xyz.autodesk.com",
  "https://formadesign.usa.autodesk.com",
  // Non-https protocols.
  ...regions.flatMap((region) => [
    `http://forma.${region}.autodesk.com`,
    `http://local.formadesign.${region}.autodesk.com`,
  ]),
  "ftp://forma.gbr.autodesk.com",
  "ws://forma.gbr.autodesk.com",
  // Lookalikes.
  "https://forma.gbr.autodesk.com.evil.com",
  "https://forma.gbr.autodesk.com.example.com",
  "https://formadesign.stg.ind.autodesk.com.example.com",
  "https://evilforma.gbr.autodesk.com",
  "https://evil.forma.gbr.autodesk.com",
  "https://forma.gbr.autodesk.com.",
  "https://xlocal.forma.gbr.autodesk.com",
  "https://local.local.forma.gbr.autodesk.com",
  "https://forma-gbr.autodesk.com",
  "https://forma.gbr.autodesk.org",
  "https://forma.gbr.autodesk.com@evil.example",
  "https://evil.example/forma.gbr.autodesk.com",
  "https://evil.example/?forma.gbr.autodesk.com",
  "https://evil.example#forma.gbr.autodesk.com",
  // Malformed.
  "not a URL",
  "",
  undefined,
  null,
  "https://",
  "//forma.gbr.autodesk.com",
  "forma.gbr.autodesk.com",
];

for (const origin of globalFallbackOrigins) {
  test(`global fallback keeps X-Ads-Region: EMEA (preserved behavior, pending platform confirmation): ${JSON.stringify(origin)}`, () => {
    assertMapping(origin, globalBaseUrl);
  });
}

test("APS never selects the legacy developer.api.autodesk.com host", () => {
  const origins = [
    ...regionalCases.map((c) => c.origin),
    ...stagingDevOrigins,
    ...globalFallbackOrigins,
  ];
  for (const origin of origins) {
    const aps = loadAps({ origin });
    assert.notEqual(aps.getApsBaseUrl(), legacyHost);
    assert.ok(!aps.getApsBaseUrl().includes("developer.api"));
  }
});

for (const component of ["ExtrudedPolygon", "GroundPolygon"]) {
  for (const { origin, baseUrl, region } of [
    { origin: "https://formadesign.stg.ind.autodesk.com", baseUrl: regionalBaseUrl("stg.ind") },
    { origin: "https://forma.gbr.autodesk.com", baseUrl: regionalBaseUrl("gbr") },
    { origin: "https://forma.autodesk.com", baseUrl: globalBaseUrl, region: "EMEA" },
  ]) {
    test(`${component} posts to the expected APS endpoint for ${origin}`, async () => {
      let tokenRequests = 0;
      const Forma = {
        origin,
        auth: {
          async acquireTokenOverlay() {
            tokenRequests += 1;
            return { accessToken: "user-token" };
          },
        },
        getProjectId: () => "project-id",
      };
      const aps = loadAps(Forma);
      let request;
      const result = [{ urn: "urn:example" }];
      const fetch = async (url, options) => {
        request = { url, options };
        return { ok: true, json: async () => result };
      };
      const imports = {
        "preact/jsx-runtime": {},
        "preact/hooks": {},
        earcut: {},
        "forma-embedded-view-sdk/auto": { Forma },
        uuid: {},
        "../../icons/Visibility.tsx": {},
        "../../util/aps.ts": aps,
        "../../util/sentry.ts": {},
      };
      const { __testCreateBasicElement } = loadModule(
        `../src/components/DynamoOutputs/${component}.tsx`,
        imports,
        { fetch },
        true,
      );
      const elements = [{ id: "element-id" }];
      assert.equal(await __testCreateBasicElement(elements), result);
      assert.equal(tokenRequests, 1);
      assert.equal(
        request.url,
        `${baseUrl}/forma/basic/v1alpha/geometries/batch-create?authcontext=project-id`,
      );
      assert.equal(request.options.method, "POST");
      assert.equal(request.options.body, JSON.stringify(elements));
      assert.equal(request.options.headers.Authorization, "Bearer user-token");
      assert.equal(request.options.headers["Content-Type"], "application/json");
      // Header expectations are current/preserved behavior, pending platform confirmation.
      assert.equal(request.options.headers["X-Ads-Region"], region);
      assert.equal(Object.hasOwn(request.options.headers, "X-Ads-Region"), Boolean(region));
    });
  }
}
