const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { JSDOM } = require("jsdom");

// Load your input data
// Use html2.html and epi2.json for the 'no category' case
global.html = fs.readFileSync(path.join(__dirname, "../data/html2.html"), "utf-8");
global.epi = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/epi2.json")));
global.ips = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/ips.json")));

// Set up DOM globally so the script can use it
const dom = new JSDOM(global.html);
global.window = dom.window;
global.document = dom.window.document;

let annotation;
beforeAll(() => {
  const scriptContent = fs.readFileSync(path.join(__dirname, "../diabetes-lens.js"), "utf-8");

  const context = {
    console,
    window,
    document,
    html: global.html,
    epi: global.epi,
    ips: global.ips,
    pv: {}, // optional
    require,
    module: {},
    exports: {},
  };

  vm.createContext(context);

  // Wrap script in IIFE to capture return value
  const wrappedScript = `(function() {\n${scriptContent}\n})();`;

  // Run the script and get the returned object
  annotation = vm.runInContext(wrappedScript, context);
});

describe("Questionnaire adding Annotation Script (non-invasive)", () => {
  test("should return version string", () => {
    expect(annotation.getSpecification()).toBe("1.0.0");
  });

  test("should return enhanced HTML containing questionaire link", async () => {
    // Change identifier to a non-matching value
    global.epi.identifier.value = "not-a-match";
    const result = await annotation.enhance();
    expect(result).toBe(global.html);
  });
});
