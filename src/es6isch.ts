
import * as fs from 'fs';
import * as path from 'path';
import * as resolveFrom from 'resolve-from';
import { resolve } from 'url';
import { NpmResolver } from './npm-file-resolver';

const Module = require('module');
const nodeLibs = require('node-libs-browser');

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

export class Es6ischMap {
  public readonly rel: string; // '/';
  public readonly abs: string; // '/test/jojo';

  public constructor(absBase: string, relBase: string) {
    this.abs = path.resolve(absBase);
    if (!relBase.startsWith('/')) {
      throw new Error('Es6ischMap has to start with a /');
    }
    this.rel = relBase;
  }
}

export interface Es6ischParam {
  rootAbsBase: string;
  moduleAbsBase?: string;
  es6ischBase?: string;
  modulesBase?: string;
}

export class Es6ischVfs {
  public readonly root: Es6ischMap;
  public readonly modules: Es6ischMap;
  public readonly es6ischBase: string;

  public static from(param: Es6ischParam): Es6ischVfs {
    return new Es6ischVfs(param.rootAbsBase, param.moduleAbsBase, param.es6ischBase, param.modulesBase);
  }

  public constructor(rootAbsBase: string, modulesAbsBase?: string,
    es6ischBase = '/es6isch', moduleBase = '/node_modules') {
    this.root = new Es6ischMap(rootAbsBase, '/');
    if (modulesAbsBase) {
      this.modules = new Es6ischMap(modulesAbsBase, moduleBase);
    } else {
      this.modules = new Es6ischMap(path.join(rootAbsBase, moduleBase), moduleBase);
    }
    this.es6ischBase = es6ischBase;
  }

}

export class Es6ischReq {
  public readonly vfs: Es6ischVfs;
  // public readonly input: string;
  public readonly toResolvInput: string;
  public readonly toResolv: string;
  public readonly isModule: boolean;
  public readonly resolveBaseFname: string;

  public static create(vfs: Es6ischVfs, toResolvInput: string, resolveBaseFname: string): Es6ischReq {
    if (!toResolvInput || toResolvInput.length == 0) {
      toResolvInput = '.';
    }
    // toResolveInput starts without '.' or '/' -> module
    // toResolveInput starts with /node_modules -> module
    let first = toResolvInput.charAt(0);
    if (!(first == '.' || first == '/')) {
      return new Es6ischReq(vfs, toResolvInput, toResolvInput, resolveBaseFname, true);
    }
    if (toResolvInput.startsWith(vfs.modules.rel)) {
      const toResolv = toResolvInput.substr(vfs.modules.rel.length).replace(/^\/+/, '');
      return new Es6ischReq(vfs, toResolvInput, toResolv, resolveBaseFname, true);
    }
    return new Es6ischReq(vfs, toResolvInput, toResolvInput, resolveBaseFname, true);
  }

  constructor(vfs: Es6ischVfs, toResolvInput: string, toResolv: string, resolveBaseFname: string, isModule: boolean) {
    this.vfs = vfs;
    this.toResolvInput = toResolvInput;
    this.toResolv = toResolv;
    this.resolveBaseFname = resolveBaseFname;
    this.isModule = isModule;
  }

}

export class Es6isch {
  public readonly isError: boolean;
  public error?: any;
  public readonly redirected: string;
  public readonly absResolved: string;
  public readonly req: Es6ischReq;
  public readonly relResolved: string;

  private static tryResolveFrom(from: string, id: string): string {
    try {
      return resolveFrom(from, id);
    } catch (err) {
      return null;
    }
  }

  public static error(req: Es6ischReq, err: any): Es6isch {
    const ret = new Es6isch(req, true);
    ret.error = err;
    return ret;
  }

  // public static fileResolv(req: Es6ischReq, map: Es6ischMap): Es6isch {
  //   try {
  //     const absPath = path.join(map.absBase, req.toResolv);
  //     const redirectTo = NpmFileResolver.create([absPath]);
  //     if (redirectTo) {
  //       if (redirectTo.resolved) {
  //         return new Es6isch(req, false, absPath, redirectTo.resolved);
  //       }
  //       return new Es6isch(req, redirectTo.error);
  //     }
  //     const absResolved = require.resolve(absPath);
  //     return new Es6isch(req, false, absResolved);
  //   } catch (e) {
  //     console.error(e);
  //     return new Es6isch(req, true);
  //   }
  // }

  // public static moduleResolv(req: Es6ischReq, rootMap: Es6ischMap, modMap: Es6ischMap): Es6isch {
  //   try {
  //     const rootAbsPath = path.join(rootMap.absBase);
  //     const redirectTo = NpmFileResolver.create(Module._nodeModulePaths(rootAbsPath));
  //     if (redirectTo) {
  //       if (redirectTo.resolved) {
  //         return new Es6isch(req, false, rootAbsPath, redirectTo.resolved);
  //       }
  //       return new Es6isch(req, redirectTo.error);
  //     }
  //     const absResolved = this.tryResolveFrom(rootAbsPath, req.toResolv);
  //     if (!absResolved) {
  //       throw new Error(`Could not resolve ${req.toResolv} from ${rootAbsPath}`);
  //     }

  //     const rewritten = path.relative(rootAbsPath, absResolved).replace(/^[\.\/]+(\/node_modules\/.*)$/, '$1');

  //     // const needsRedirect = typeof fdir === 'string';
  //     let toTop = path.relative(rootAbsPath, req.vfs.root.absBase);
  //     if (toTop.length == 0) {
  //       toTop = '/';
  //     }

  //     const redirected = path.join(toTop, rewritten);
  //     // return needsRedirect
  //     //   ? new Es6isch(req, false, absResolved, redirected)
  //     //   : new Es6isch(req, false, absResolved, null, redirected);
  //   } catch (e) {
  //     return Es6isch.error(req, e);
  //   }
  // }

  // public static resolving(searchPath: string[], toResolv: string, req: Es6ischReq, map: Es6ischMap): Es6isch {
  //   try {
  //     // const absPath = path.join(map.absBase, req.toResolv);
  //     const redirectTo = NpmFileResolver.create(searchPath, toResolv);
  //     if (redirectTo) {
  //       if (redirectTo.resolved) {
  //         return new Es6isch(req, false, toResolv, redirectTo.resolved);
  //       }
  //       return new Es6isch(req, redirectTo.error);
  //     }
  //     // const absResolved = require.resolve(absPath);
  //     // return new Es6isch(req, false, absResolved);
  //   } catch (e) {
  //     console.error(e);
  //     return new Es6isch(req, true);
  //   }
  // }

  public static resolve(vfs: Es6ischVfs, toResolv: string, resolvDir = '/'): Es6isch {
    const req = Es6ischReq.create(vfs, toResolv, resolvDir);
    // console.log('TEST-NODE', req.toResolv, toResolv, resolvDir, req.vfs.modules.relBase);
    if (req.isModule) {
      // console.log('NODE_MODULES', req.toResolv);
      // return Es6isch.resolving(Module._nodeModulePaths(vfs.modules.absBase), req, req.vfs.modules);
    }
    // return Es6isch.resolving([toResolv], req, req.vfs.root);
    return null;
  }

  public constructor(req: Es6ischReq, error: any,
    absResolved?: string, redirected?: string, relResolved?: string) {
    this.req = req;
    this.error = error;
    this.absResolved = absResolved;
    this.relResolved = relResolved;
    if (redirected && redirected.length > 0) {
      this.redirected = redirected;
    }
  }

}
