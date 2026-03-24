const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { JSDOM } = require("jsdom");

describe("Diabetes Lens Integration", () => {
  function loadDataSet(htmlFile, epiFile, ipsFile) {
    global.html = fs.readFileSync(path.join(__dirname, `../data/${htmlFile}`), "utf-8");
    global.epi = JSON.parse(fs.readFileSync(path.join(__dirname, `../data/${epiFile}`)));
    global.ips = JSON.parse(fs.readFileSync(path.join(__dirname, `../data/${ipsFile}`)));
    const dom = new JSDOM(global.html);
    global.window = dom.window;
    global.document = dom.window.document;
  }

  function runLens() {
    const scriptContent = fs.readFileSync(path.join(__dirname, "../diabetes-lens.js"), "utf-8");
    const context = {
      console,
      window,
      document,
      html: global.html,
      epi: global.epi,
      ips: global.ips,
      pv: {},
      require,
      module: {},
      exports: {},
    };
    vm.createContext(context);
    const wrappedScript = `(function() {\n${scriptContent}\n})();`;
    return vm.runInContext(wrappedScript, context);
  }

  test("should inject checklist for matching category (en)", async () => {
    loadDataSet("html.html", "epi.json", "ips.json");
    const lens = runLens();
    const result = await lens.enhance();
    expect(result).toContain("checklist");
    expect(result).toContain("Checklist");
  });

  test("should inject checklist for matching category (pt)", async () => {
    loadDataSet("html.html", "epi.json", "ips.json");
    global.epi.entry[0].resource.language = "pt";
    const lens = runLens();
    const result = await lens.enhance();
    expect(result).toContain("Lista de Verificação");
  });

  test("should inject checklist for matching category (es)", async () => {
    loadDataSet("html.html", "epi.json", "ips.json");
    global.epi.entry[0].resource.language = "es";
    const lens = runLens();
    const result = await lens.enhance();
    expect(result).toContain("Lista de Comprobación");
  });

  test("should inject checklist for matching category (da)", async () => {
    loadDataSet("html.html", "epi.json", "ips.json");
    global.epi.entry[0].resource.language = "da";
    const lens = runLens();
    const result = await lens.enhance();
    expect(result).toContain("Tjekliste");
  });

  test("should do nothing if no matching identifier", async () => {
    loadDataSet("html.html", "epi.json", "ips.json");
    global.epi.identifier.value = "not-a-match";
    if (global.epi.entry && global.epi.entry[0] && global.epi.entry[0].resource && global.epi.entry[0].resource.identifier) {
      global.epi.entry[0].resource.identifier.value = "not-a-match";
    }
    const lens = runLens();
    const result = await lens.enhance();
    expect(result).toBe(global.html);
  });

  test("should inject checklist at top if no category found", async () => {
    loadDataSet("html2.html", "epi2.json", "ips.json");
    const lens = runLens();
    const result = await lens.enhance();
    expect(result).toContain("checklist");
    // Should be at the top
    expect(result.trim().startsWith("<div class=\"checklist\""));
  });
});
