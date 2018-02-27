import { Es6isch } from './es6isch';
import * as fs from 'fs';

const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;

function asVar(x: string): string {
  return x.replace(/([^A-Za-z0-9]+)/g, '_');
}

export class Es6Parsed {
  public readonly res: Es6isch;
  public readonly parsed: string;
  public readonly resolved: Es6isch[];

  constructor(res: Es6isch, parsed: string, resolved: Es6isch[]) {
    this.res = res;
    this.parsed = parsed;
    this.resolved = resolved;
  }
}

export function parse(res: Es6isch):  Es6Parsed {
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
  return new Es6Parsed(res, [
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
  ].join('\n'), resolved);
  //  console.log(file.toString());
}
