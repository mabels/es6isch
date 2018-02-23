const babel =  require("@babel/core");
const traverse = require("@babel/traverse").default;
const fs = require('fs');
const path = require('path');

const wurst = require('./wurst');
const wurst_index = require('./wurst/index');
const wurst_index_js = require('./wurst/index.js');

const wurst_doof = require('./wurst/doof');
const wurst_doof_index = require('./wurst/doof');

function findPathOfPackageJson(str) {
  if (str.length === 0) { return null; }
  let base = path.dirname(str);
  if (base === str) { base = ''; }
  const pjson = path.join(base, 'package.json');
  // console.log(`findPathOfPackageJson:${str} => ${pjson}`);
  const ret = fs.existsSync(pjson);
  if (!ret) {
    return findPathOfPackageJson(base);
  }
  return base;
}


function asVar(x) {
  // console.log(x);
  return x.replace(/([^A-Za-z0-9]+)/g, '_');
  // (m) => m[1].toUpperCase());
}

function dots(fname, nodePath) {
}

function resolvEs6Path(packagePath, nodePath, fname) {
  if (nodePath.startsWith('./') || nodePath.startsWith('../') || nodePath.startsWith('/')) {
    let with_js = nodePath;
    try {
      const absNodePath = path.join(path.dirname(fname), nodePath);
      console.log(nodePath, fname, absNodePath);
      const stat = fs.statSync(absNodePath);
      if (stat.isDirectory()) {
        let packageJson;
        try {
          packageJson = JSON.parse(fs.readFileSync(path.join(absNodePath, 'package.json')));
          // console.log(`XXXXX:${JSON.stringify(packageJson.main)}`);
        } catch (e) {
          packageJson = {};
        }
        with_js = `${with_js}/${packageJson.main || 'index.js'}`;
      }
    } catch (e) {
      with_js = `${with_js}.js`;
    }
    return with_js;
  }
  return resolvEs6Path(packagePath, `./${path.join('node_modules', nodePath)}`, fname);
  // return `${dots(fname, nodePath)}/node_modules/${nodePath}.....js`;
}

function es6isch(fsname) {
  const fname = path.resolve(fsname);
  const file = fs.readFileSync(fname);
  const ast = babel.parse(file);
  const packagePath = findPathOfPackageJson(fname);

  const required = [];
  traverse(ast, {
    CallExpression(ce) {
      //console.log(ce);
      const n = ce.node;
      if (!(n.callee.type == 'Identifier' && n.callee.name == 'require')) {
        return;
      }
      const sl = n.arguments.filter(a => a.type == 'StringLiteral').map(a => a.value);
      required.push.apply(required, sl);
      //
      // if (path.isIdentifier({ name: "require" })) {
      //   console.log(path);
      //
    }
  });
  return [
    required.map(r => `import * as require_${asVar(r)} from '${resolvEs6Path(packagePath, r, fname)}';`).join('\n'),
    `function require(fname) {`,
    `return ({`,
    required.map((i) => `${JSON.stringify(i)}: require_${asVar(i)}`).join(',\n'),
    `})[fname];`,
    `}`,
    file.toString()
  ].join('\n');
  //  console.log(file.toString());
}

module.exports = es6isch;
