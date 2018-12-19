/* jshint node:true */

var broccoli = require("broccoli");
var Watcher = require("broccoli-sane-watcher");
var Funnel = require("broccoli-funnel");
var builder = require("broccoli-multi-builder");
var mergeTrees = require("broccoli-merge-trees");
var testTreeBuilder = require("broccoli-test-builder");
var jquery = require("./broccoli/jquery");
var BroccoliLiveReload = require("broccoli-livereload");
var replace = require("broccoli-string-replace");
var demoTree = require("./broccoli/demo");

var vendoredModules = [
  { name: "mobiledoc-dom-renderer" },
  { name: "mobiledoc-text-renderer" }
];

var cssFiles = new Funnel("src/css", { destDir: "css" });

var testTree = testTreeBuilder.build({ libDirName: "src" });
testTree = jquery.build(testTree, "/tests/jquery");
testTree = new BroccoliLiveReload(testTree, { target: "index.html" });

var testBuilder = new broccoli.Builder(testTree);

const USE_ROLLUP = true;

if (!USE_ROLLUP) {
  var packageName = require("./package.json").name;

  var buildOptions = {
    libDirName: "src/js",
    vendoredModules: vendoredModules,
    packageName: packageName
  };

  function replaceVersion(tree) {
    var version = require("./package.json").version;
    return replace(tree, {
      files: ["**/*.js"],
      pattern: { match: /##VERSION##/g, replacement: version }
    });
  }

  module.exports = mergeTrees([
    replaceVersion(builder.build("amd", buildOptions)),
    replaceVersion(builder.build("global", buildOptions)),
    replaceVersion(builder.build("commonjs", buildOptions)),
    cssFiles,
    testTree,
    demoTree()
  ]);
} else {
  const globalTree = require("./broccoli/global");
  const commonJsTree = require("./broccoli/commonjs");
  const amdTree = require("./broccoli/amd");

  const jsTrees = globalTree();

  jsTrees.push(commonJsTree());
  jsTrees.push(amdTree(vendoredModules));

  module.exports = mergeTrees(jsTrees.concat([cssFiles, testTree, demoTree()]));
}
