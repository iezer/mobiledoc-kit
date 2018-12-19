const babel = require("broccoli-babel-transpiler");
const Funnel = require("broccoli-funnel");
const concatenate = require("broccoli-concat");
const mergeTrees = require("broccoli-merge-trees");

function resolveSourceToAbsolute(source, filename) {
  var isRelativeImport = source.indexOf(".") !== -1;
  if (!isRelativeImport) {
    return source;
  }

  var path = require("path");
  var sourceParts = source.split("/");
  var fileParts = path.dirname(filename).split("/");

  var sourcePart = sourceParts.shift();
  while (sourcePart) {
    if (sourcePart === "..") {
      fileParts.pop();
    } else if (sourcePart !== ".") {
      fileParts.push(sourcePart);
    }

    sourcePart = sourceParts.shift();
  }
  return fileParts.join("/");
}

module.exports = function(vendoredModules) {
  let tree = babel("src/js", {
    moduleIds: true,
    getModuleId(path) {
      //console.log(`getModuleId ${path}`);
      const index = path.indexOf("mobiledoc-kit");
      if (index !== -1) {
        return path.slice(index).replace("/index", "");
      }
    },
    plugins: [
      ["babel-plugin-transform-es2015-modules-amd", { noInterop: true }],
      [
        "module-resolver",
        {
          extensions: ".js",
          cwd: "packagejson",
          resolvePath: function(sourcePath, currentFile, opts) {
            let path = resolveSourceToAbsolute(sourcePath, currentFile);

            const index = path.indexOf("mobiledoc-kit");
            if (index !== -1) {
              path = path.slice(index).replace("/index", "");
            }

            // console.log(`resolvePath ${sourcePath} ${currentFile} ${path}`);

            return path;
          }
        }
      ]
    ]
  });

  const vendoredModulesFiles = vendoredModules.map(
    ({ name }) => `${name}/dist/amd/${name}.js`
  );

  const vendorTree = new Funnel("node_modules", {
    include: vendoredModulesFiles
  });

  tree = mergeTrees([tree, vendorTree]);

  return concatenate(tree, {
    inputFiles: ["**/*.js"],
    outputFile: "/amd/mobiledoc-kit.js",
    header: "/** Copyright **/"
  });
};
