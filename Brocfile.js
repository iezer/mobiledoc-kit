/* jshint node:true */

var broccoli = require("broccoli");
var concatenate = require("broccoli-concat");
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
  const Rollup = require("broccoli-rollup");
  const babel = require("rollup-plugin-babel");
  const resolve = require("rollup-plugin-node-resolve");
  const commonjs = require("rollup-plugin-commonjs");
  const importAlias = require("rollup-plugin-import-alias");

  let jsTrees = [
    ["global", "iife", "Mobiledoc"]
    // ["commonjs", "cjs", "Mobiledoc"],
    //["amd", "amd", "mobiledoc-kit"],
    //["es6", "es", "mobiledoc-kit"]
    // ["umd", "umd", "mobiledoc-kit"]
  ].map(function(configuration) {
    const outputDir = configuration[0];
    const outputFormat = configuration[1];
    const outputName = configuration[2];

    return new Rollup("src/js", {
      inputFiles: ["**/*.js"],
      annotation: "JS Transformation",
      rollup: {
        input: "index.js",
        output: {
          name: outputName,
          file: outputDir + "/mobiledoc-kit.js",
          format: outputFormat,
          amd: {
            id: "mobiledoc-kit"
          },
          sourcemap: true
        },
        plugins: [
          babel({
            exclude: "node_modules/**"
          }),
          resolve({
            jsnext: true,
            main: true
          }),
          commonjs(),
          importAlias({
            Paths: {
              "mobiledoc-kit": "src/js"
            },
            Extensions: ["js"]
          })
        ],
        external: ["mobiledoc-kit"]
      }
    });
  });

  module.exports = mergeTrees(jsTrees.concat([cssFiles, testTree, demoTree()]));
}
