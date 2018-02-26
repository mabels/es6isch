
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

export class Es6ischVfs {
  public readonly root: Es6ischMap;
  public readonly modules: Es6ischMap;

  public constructor(rootAbsBase: string, modulesAbsBase: string) {
    this.root = new Es6ischMap(rootAbsBase, '/');
    this.modules = new Es6ischMap(modulesAbsBase, '/node_modules');
  }

}

export class Es6ischReq {
  public readonly vfs: Es6ischVfs;
  public readonly toResolv: string;
  public readonly resolvDir: string;

  public constructor(vfs: Es6ischVfs, toResolv: string, resolvDir = '/') {
    if (!toResolv || toResolv.length == 0) {
      toResolv = '.';
    }
    this.vfs = vfs;
    this.toResolv = toResolv;
    this.resolvDir = resolvDir;
  }
}

export class Es6isch {
  public readonly isError: boolean;
  public readonly redirected: string;
  public readonly absResolved: string;
  public readonly req: Es6ischReq;

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
      return new Es6isch(req, true);
    }
  }

  public static moduleResolv(req: Es6ischReq, rootMap: Es6ischMap, modMap: Es6ischMap): Es6isch {
    try {
      const statResolvDir = fs.statSync(path.join(rootMap.absBase, req.resolvDir));
      // console.log(`absPath:${statResolvDir}`);
      let resolvDir = req.resolvDir;
      if (!statResolvDir.isDirectory()) {
        resolvDir = `${path.dirname(req.resolvDir)}/`;
      }
      const rootAbsPath = path.join(rootMap.absBase, resolvDir);
      const modAbsPath = path.join(modMap.absBase, req.toResolv);
      const absResolved = require.resolve(modAbsPath);
      let redirected = path.relative(rootAbsPath, absResolved);
      // console.log(`redirected\n${redirected}\n${rootAbsPath}\n${absResolved}`);
      if (redirected.length > 0) {
        if (!redirected.startsWith('.')) {
          redirected = `./${redirected}`;
        }
      }
      return new Es6isch(req, false, absResolved, redirected);
    } catch (e) {
      return new Es6isch(req, true);
    }
  }

  public static resolve(vfs: Es6ischVfs, toResolv: string, resolvDir = '/'): Es6isch {
    const req = new Es6ischReq(vfs, toResolv, resolvDir);
    if (req.toResolv.startsWith('/')) {
      return new Es6isch(req, true);
    }
    // WHY are these method are not the same?
    if (req.toResolv.startsWith('.')) {
      return Es6isch.fileResolv(req, req.vfs.root);
    } else {
      return Es6isch.moduleResolv(req, req.vfs.root, req.vfs.modules);
    }
  }

  public constructor(req: Es6ischReq, isError: boolean,
    absResolved?: string, redirected?: string) {
    this.req = req;
    this.isError = isError;
    this.absResolved = absResolved;
    if (redirected && redirected.length > 0) {
      this.redirected = redirected;
    }
  }

}
