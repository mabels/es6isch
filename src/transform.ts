import { Cachator } from './cachator';
import { NpmResolver } from './npm-resolver';

const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;

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
    // console.log(`Hallo:${file}`);
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
      return cc.npmResolver(base.redirectBase, base.root, base.searchPath, base.resolved().rel, toResolv);
    });

    return new Transform(base, [
      resolved.sort((a, b) => a.found() ? 0 : 1).map(r => {
        if (!r.found()) {
          return `/* not found:${r.is}:[${r.inFname}] */`;
        } else {
          return `import * as require_${r.asVar()} from '${r.isPath()}';`;
        }
      }).join('\n'),
      `const module = { exports: {} };`,
      `function require(fname) {`,
      `return ({`,
      resolved.filter(i => i.found()).map((i) => {
        return `${JSON.stringify(i.inFname)}: require_${i.asVar()}`;
      }).join(',\n'),
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
