const babel = require("broccoli-babel-transpiler");
const Funnel = require("broccoli-funnel");

module.exports = function() {
  let tree = babel("src/js", {
    moduleRoot: "mobiledoc-kit",
    plugins: [["@babel/plugin-transform-modules-commonjs", { noInterop: true }]]
  });

  return new Funnel(tree, {
    destDir: "commonjs/mobiledoc-kit"
  });
};
