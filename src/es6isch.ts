
import * as fs from 'fs';
import * as path from 'path';
import * as resolveFrom from 'resolve-from';

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
  public readonly relBase: string; // '/';
  public readonly absBase: string; // '/test/jojo';

  public constructor(absBase: string, relBase: string) {
    this.absBase = path.resolve(absBase);
    if (!relBase.startsWith('/')) {
      throw new Error('Es6ischMap has to start with a /');
    }
    this.relBase = relBase;
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
  public readonly input: string;
  public readonly toResolv: string;
  public readonly isModule: boolean;
  public readonly resolvDir: string;

  public constructor(vfs: Es6ischVfs, toResolv: string, resolvDir = '/') {
    if (!toResolv || toResolv.length == 0) {
      toResolv = '.';
    }
    this.vfs = vfs;
    const first = toResolv.charAt(0);
    if (toResolv.startsWith(vfs.modules.relBase)) {
      this.toResolv = toResolv.substr(vfs.modules.relBase.length).replace(/^\/+/, '');
      this.isModule = true;
    } else if (!(first == '.' || first == '/')) {
      this.toResolv = toResolv;
      this.isModule = true;
    } else {
      this.toResolv = toResolv;
      this.isModule = false;
    }
    this.resolvDir = resolvDir;
  }
}

export class Es6isch {
  public readonly isError: boolean;
  public readonly redirected: string;
  public readonly absResolved: string;
  public readonly req: Es6ischReq;
  public readonly relResolved: string;

  public static fileResolv(req: Es6ischReq, map: Es6ischMap): Es6isch {
    try {
      const statResolvDir = fs.statSync(path.join(map.absBase, req.resolvDir));
      let resolvDir = req.resolvDir;
      if (!statResolvDir.isDirectory()) {
        resolvDir = path.dirname(req.resolvDir);
      }
      const absPath = path.join(map.absBase, resolvDir, req.toResolv);
      // console.log(`absPath:${absPath}`);
      const absResolved = require.resolve(absPath);
      let redirected = path.relative(absPath, absResolved);
      if (redirected.length > 0) {
        redirected = path.join(req.toResolv, redirected);
        if (!redirected.startsWith('.')) {
          redirected = `./${redirected}`;
        }
      }
      return new Es6isch(req, false, absResolved, redirected);
    } catch (e) {
      console.error(e);
      return new Es6isch(req, true);
    }
  }

  public static moduleResolv(req: Es6ischReq, rootMap: Es6ischMap, modMap: Es6ischMap): Es6isch {
    try {
      let resolvDir = req.resolvDir;
      try {
        const statResolvDir = fs.statSync(path.join(rootMap.absBase, req.resolvDir));
        // console.log(`absPath:${statResolvDir}`);
        if (!statResolvDir.isDirectory()) {
          resolvDir = `${path.dirname(req.resolvDir)}/`;
        }
      } catch (e) {
        /* */
      }
      const rootAbsPath = path.join(rootMap.absBase, resolvDir);

      const nmp: string[] = Module._nodeModulePaths(rootAbsPath);
      let fdir: string = null;
      for (let mdirIdx = 0; !fdir && mdirIdx < nmp.length; ++mdirIdx) {
        fdir = [
          path.join(nmp[mdirIdx], req.toResolv, 'package.json'),
          path.join(nmp[mdirIdx], req.toResolv, 'index.js'),
          path.join(nmp[mdirIdx], `${req.toResolv}.js`)
        ].find(ndir => {
          // console.log(ndir);
          return fs.existsSync(ndir);
        });
      }
      // console.log(`FOUND:${fdir}:${rootAbsPath}:${req.toResolv}`);
      // const modAbsPath = path.join(modMap.absBase, req.toResolv);
      // console.log(`resolve:${req.toResolv}:${rootAbsPath}:${req.vfs.root.absBase}`);
      const absResolved = nodeLibs[req.toResolv] || tryResolveFrom(rootAbsPath, req.toResolv);

      if (!absResolved) {
        throw new Error(`Could not resolve ${req.toResolv} from ${rootAbsPath}`);
      }

      const rewritten = path.relative(rootAbsPath, absResolved).replace(/^[\.\/]+(\/node_modules\/.*)$/, '$1');

      const needsRedirect = typeof fdir === 'string';
      let toTop = path.relative(rootAbsPath, req.vfs.root.absBase);
      if (toTop.length == 0) {
        toTop = '/';
      }

      const redirected = path.join(toTop, rewritten);
      return needsRedirect
        ? new Es6isch(req, false, absResolved, redirected)
        : new Es6isch(req, false, absResolved, null, redirected);
    } catch (e) {
      console.error(e);
      return new Es6isch(req, true);
    }
  }

  public static resolve(vfs: Es6ischVfs, toResolv: string, resolvDir = '/'): Es6isch {
    const req = new Es6ischReq(vfs, toResolv, resolvDir);
    // console.log('TEST-NODE', req.toResolv, toResolv, resolvDir, req.vfs.modules.relBase);
    if (req.isModule) {
      // console.log('NODE_MODULES', req.toResolv);
      return Es6isch.moduleResolv(req, req.vfs.root, req.vfs.modules);
    }
    return Es6isch.fileResolv(req, req.vfs.root);
  }

  public constructor(req: Es6ischReq, isError: boolean,
    absResolved?: string, redirected?: string, relResolved?: string) {
    this.req = req;
    this.isError = isError;
    this.absResolved = absResolved;
    this.relResolved = relResolved;
    if (redirected && redirected.length > 0) {
      this.redirected = redirected;
    }
  }

}

function tryResolveFrom(from: string, id: string): string | null {
  try {
    return resolveFrom(from, id);
  } catch (err) {
    return null;
  }
}
