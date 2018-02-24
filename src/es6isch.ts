// import * as babel from '@babel/core';
const babel = require('@babel/core');
// import traverse from '@babel/traverse';
const traverse = require('@babel/traverse').default;
import * as fs from 'fs';
import * as path from 'path';

export function findPathOfPackageJson(str: string): string {
  if (str.length === 0) { return null; }
  let pjson: string = str;
  if (!str.endsWith('package.json')) {
    pjson = path.join(str, 'package.json');
  } 
  // console.log(`findPathOfPackageJson:${pjson}`);
  const ret = fs.existsSync(pjson);
  if (!ret) {
    return findPathOfPackageJson(path.basename(path.dirname(pjson)));
  }
  return path.dirname(pjson);
}


function asVar(x: string): string {
  // console.log(x);
  return x.replace(/([^A-Za-z0-9]+)/g, '_');
  // (m) => m[1].toUpperCase());
}

// function splitPath(name): string {
//   return name.replace(/\/+/, '/');
// }

// function relative(f1: string, f2: string): string {
//   console.log(splitPath(f1), splitPath(f2));
//   return '..';
// }
interface Resolved {
  pkgBase: string; 
  // requirePath: string;
  relative: string;
  relativeReq: string;
  reqFilename: string;
}

function nodeResolver(pkgBase: string, requirePath: string): Resolved {
  const relative = path.relative(__dirname, pkgBase);
  const relativeReq = path.join(relative, requirePath);
  return { 
    pkgBase,
    // requirePath,
    relative, 
    relativeReq, 
    reqFilename: require.resolve(requirePath)
  }
}

function resolvEs6Path(nres: Resolved, requirePath: string): string {
  if (requirePath.startsWith('./') || 
      requirePath.startsWith('../') || 
      requirePath.startsWith('/')) {
    let with_js = requirePath;
    try {
      // const absNodePath = path.join(path.dirname(fname), requirePath);
      console.log(requirePath);
      const stat = fs.statSync(nres.reqFilename);
      if (stat.isDirectory()) {
        let packageJson;
        try {
          packageJson = JSON.parse(fs.readFileSync(path.join(nres.reqFilename, 'package.json')).toString());
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
  const rq = requirePath; // `${nres.relative}/node_modules/${requirePath}`;
  console.log(`===>`, rq);
  nres = nodeResolver(nres.pkgBase, rq);
  // const tmpName = require.resolve(requirePath);
  return resolvEs6Path(nres, rq);
  // return `${dots(fname, nodePath)}/node_modules/${nodePath}.....js`;
}

export function es6isch(pkgBase: string, requirePath: string): string {
  const relative = path.relative(__dirname, pkgBase);
  const nres = nodeResolver(pkgBase, `${relative}/${requirePath}`);
  //console.log(`es6isch:${pkgBase}=>${requirePath}:${__dirname}:${nres.relative}:${nres.relativeReq}:${nres.reqFilename}`);
  const file = fs.readFileSync(nres.reqFilename);
  const ast = babel.parse(file);
  // const packagePath = findPathOfPackageJson(fname);

  const required: string[] = [];
  traverse(ast, {
    CallExpression(ce: any) {
      //console.log(ce);
      const n = ce.node;
      if (!(n.callee.type == 'Identifier' && n.callee.name == 'require')) {
        return;
      }
      const sl = n.arguments
        .filter((a: any) => a.type == 'StringLiteral')
        .map((a: any) => a.value);
      required.push.apply(required, sl);
    }
  });
  return [
    required.map(r => `import * as require_${asVar(r)} from '${resolvEs6Path(nres, r)}';`).join('\n'),
    `const module = { exports: {} };`,
    `function require(fname) {`,
    `return ({`,
    required.map((i) => `${JSON.stringify(i)}: require_${asVar(i)}`).join(',\n'),
    `})[fname].default;`,
    `}`,
    file.toString(),
    `export default module.exports;`,
  ].join('\n');
  //  console.log(file.toString());
}

