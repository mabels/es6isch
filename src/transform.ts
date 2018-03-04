// import { Es6isch } from './es6isch';
// import * as fs from 'fs';
import * as path from 'path';
import { Cachator } from './cachator';
import { NpmResolver } from './npm-resolver';

const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;

function asVar(x: string): string {
  return x.replace(/([^A-Za-z0-9]+)/g, '_');
}

export class Transform {
  public readonly base: NpmResolver;
  public readonly resolved: NpmResolver[];
  public readonly transformed: string;
  // public readonly resolved: Es6isch[];

  public static run(cc: Cachator, base: NpmResolver): Transform {
    // console.log(`es6isch:${pkgBase}=>${requirePath}:${__dirname}:${nres.relative}:${nres.relativeReq}:
    // ${nres.reqFilename}`);
    return cc.transform(base);
  }

  public static fromString(cc: Cachator, base: NpmResolver, file: string): Transform {
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
      return cc.npmResolver(base.root, base.searchPath, base.resolved().rel, toResolv);
    });

    return new Transform(base, [
      resolved.sort((a, b) => a.found() ? 0 : 1).map(r => {
        if (!r.found()) {
          return `/* ERROR
            ${JSON.stringify({ base, r }, null, 2)}
          */`;
        } else {
          return `import * as require_${asVar(r.inFname)} from '${r.resolved().rel}';`;
        }
      }).join('\n'),
      `const module = { exports: {} };`,
      `function require(fname) {`,
      `return ({`,
      resolved.map((i) => {
        if (!i.found()) { return null; }
        return `${JSON.stringify(i.inFname)}: require_${asVar(i.inFname)}`;
      }).filter(i => i).join(',\n'),
      `})[fname].default;`,
      `}`,
      file.toString(),
      `export default module.exports;`,
    ].join('\n'), resolved);
    //  console.log(file.toString());
  }

  constructor(base: NpmResolver, transformed: string, resolved: NpmResolver[]) {
    this.base = base;
    this.transformed = transformed;
    this.resolved = resolved;
  }

  public found(): boolean {
    return this.resolved.reduce((r, i) => r && i.found(), this.base.found());
  }

}
