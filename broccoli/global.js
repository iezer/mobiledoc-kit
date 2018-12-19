const Rollup = require("broccoli-rollup");
const rollupBabel = require("rollup-plugin-babel");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const importAlias = require("rollup-plugin-import-alias");

module.exports = function() {
  let jsTrees = [
    ["global", "iife", "Mobiledoc"]
    //["commonjs", "cjs", "mobiledoc-kit"]
    //["amd-rollup", "amd", "mobiledoc-kit"],
    //["es6", "es", "mobiledoc-kit"]
    //["umd", "umd", "mobiledoc-kit"]
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
          rollupBabel({
            exclude: "node_modules/**",
            presets: [
              [
                "@babel/preset-env",
                { targets: { browsers: ["last 2 versions"] } }
              ]
            ]
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

  return jsTrees;
};
