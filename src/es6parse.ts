import { Es6isch } from './es6isch';
// import * as path from 'path';
import * as fs from 'fs';
// import * as babel from '@babel/core';
const babel = require('@babel/core');
// import traverse from '@babel/traverse';
const traverse = require('@babel/traverse').default;

// export default Es6isch;

/*
    let redirected: string = null;
    let isError = false;
    let absResolved = null;
    try {
      let base: string;
      let absToResolv: string;
      let moduleBase = '';
      if (toResolv.startsWith('/')) {
        absToResolv = path.join(rootPath, toResolv);
      }
      if (toResolv.startsWith('.')) {
        const stat = fs.statSync(baseFile);
        if (stat.isDirectory()) {
          absToResolv = path.join(baseFile, toResolv);
        } else {
          absToResolv = path.join(path.dirname(baseFile), toResolv);
        }
      } else {
        absToResolv = path.join(nodeModules, toResolv);
      }
      absToResolv = path.resolve(absToResolv);
      console.log(`absToResolv:${absToResolv}`);
      absResolved = require.resolve(absToResolv);
      if (absToResolv != absResolved) {
        redirected = path.relative(base, path.join(moduleBase, absToResolv, path.relative(absToResolv, absResolved)));
      }
    } catch (e) {
      isError = true;
    }
    return new Es6isch(redirected, isError, absResolved, toResolv, baseFile);
*/

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
// interface Resolved {
//   pkgBase: string;
//   // requirePath: string;
//   relative: string;
//   relativeReq: string;
//   reqFilename: string;
// }

// function nodeResolver(pkgBase: string, requirePath: string): Resolved {
//   const relative = path.relative(__dirname, pkgBase);
//   const relativeReq = path.join(relative, requirePath);
//   return {
//     pkgBase,
//     // requirePath,
//     relative,
//     relativeReq,
//     reqFilename: require.resolve(requirePath)
//   };
// }

// function resolvEs6Path(nres: Resolved, requirePath: string): string {
//   if (requirePath.startsWith('./') ||
//       requirePath.startsWith('../') ||
//       requirePath.startsWith('/')) {
//     let with_js = requirePath;
//     try {
//       // const absNodePath = path.join(path.dirname(fname), requirePath);
//       console.log(requirePath);
//       const stat = fs.statSync(nres.reqFilename);
//       if (stat.isDirectory()) {
//         let packageJson;
//         try {
//           packageJson = JSON.parse(fs.readFileSync(path.join(nres.reqFilename, 'package.json')).toString());
//           // console.log(`XXXXX:${JSON.stringify(packageJson.main)}`);
//         } catch (e) {
//           packageJson = {};
//         }
//         with_js = `${with_js}/${packageJson.main || 'index.js'}`;
//       }
//     } catch (e) {
//       with_js = `${with_js}.js`;
//     }
//     return with_js;
//   }
//   const rq = requirePath; // `${nres.relative}/node_modules/${requirePath}`;
//   console.log(`===>`, rq);
//   nres = nodeResolver(nres.pkgBase, rq);
//   // const tmpName = require.resolve(requirePath);
//   return resolvEs6Path(nres, rq);
//   // return `${dots(fname, nodePath)}/node_modules/${nodePath}.....js`;
// }

export class Es6Parsed {
    public readonly res: Es6isch;
}

export function parse(res: Es6isch): string {
  // console.log(`es6isch:${pkgBase}=>${requirePath}:${__dirname}:${nres.relative}:${nres.relativeReq}:
  // ${nres.reqFilename}`);
  const file = fs.readFileSync(res.absResolved).toString();
  const ast = babel.parse(file);
  // const packagePath = findPathOfPackageJson(fname);
  let required: string[] = [];
  traverse(ast, {
    CallExpression(ce: any): void {
      // console.log(ce);
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
  const resolved = Array.from(new Set(required)).map(toResolv => {
    return Es6isch.resolve(res.req.vfs, toResolv, res.req.toResolv);
  });
  return [
    resolved.map(r =>
      `import * as require_${asVar(r.req.toResolv)} from '${r.redirected || r.req.toResolv}';`
    ).join('\n'),
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
