
import * as path from 'path';
// import * as fs from 'fs';
import { Cachator } from './cachator';

export enum NpmFoundState {
  UNDEF = 'undef',
  FOUND = 'found',
  NOTFOUND = 'notfound'
}

export enum NpmIs {
  FILE = 'FILE',
  MODULE = 'MODULE'
}

export abstract class Resolved {
  public readonly root: string;
  public readonly relDir: string;
  public readonly inFname: string;
  public readonly redirect: boolean;
  public readonly found: NpmFoundState;
  public readonly error?: any;

  public static file(root: string, relDir: string, inFname: string, suffix = ''): () => Resolved {
    return () => {
      const fname = `${inFname}${suffix}`;
      // const absFname = path.join(root, relDir, fname);
      // console.log(`FileNpmResolve:${relDir}:${fname}`);
      return new FileNpmResolve(root, relDir, fname, null, NpmFoundState.UNDEF);
    };
  }

  public static found(root: string, relDir: string, inFname: string): () => Resolved {
    return () => {
      // console.log(`FOUND`);
      return new FileNpmResolve(root, relDir, inFname, null, NpmFoundState.FOUND);
    };
  }

  public static notFound(root: string, relDir: string, inFname: string): () => Resolved {
    return () => {
      // console.log(`NOTFOUND`);
      return new FileNpmResolve(root, relDir, inFname, null, NpmFoundState.NOTFOUND);
    };
  }

  public static package(rc: Cachator, root: string, relDir: string): () => Resolved {
    return () => {
      let packageJson: any;
      const absPackageJson = path.join(root, relDir, 'package.json');
      packageJson = rc.readJsonFile(absPackageJson) || {};
      return new PackageNpmResolve(root, relDir, packageJson.main || 'index', null);
    };
  }

  constructor(root: string, relDir: string, inFname: string, error: any, found: NpmFoundState) {
    this.root = root;
    this.relDir = relDir;
    this.inFname = inFname;
    this.redirect = false;
    this.found = found;
    this.error = error;
  }

  public abstract reResolv(cb: () => Resolved): Resolved;

  public toObj(): any {
    return this;
  }
}

export class FileNpmResolve extends Resolved {
  constructor(absBase: string, absFname: string, relFname: string, error: any, found: NpmFoundState) {
    super(absBase, absFname, relFname, error, found);
  }
  public reResolv(cb: () => Resolved): Resolved {
    return null;
  }
}

export class PackageNpmResolve extends Resolved {
  constructor(absBase: string, absFname: string, relFname: string, error: any) {
    super(absBase, absFname, relFname, error, NpmFoundState.UNDEF);
  }
  public reResolv(cb: () => Resolved): Resolved {
    return cb();
  }
}

// export interface NpmSearchPath {
//   path: string;
//   isPackage: boolean;
//   isModuleDirectory: boolean;
// }

// export function fileRoot(pRoot: string, base = ''): NpmSearchPath {
//   const p = path.join(pRoot, base);
//   if (!base && path.relative(pRoot, p).length == 0) {
//     return { path: pRoot, isPackage: true, isModuleDirectory: false };
//   }
//   return { path: p, isPackage: false, isModuleDirectory: false };
// }

// export function moduleRoot(root: string): NpmSearchPath {
//   return { path: root, isPackage: false, isModuleDirectory: true };
// }

export interface NpmRelAbs {
  rel: string;
  abs: string;
}

export class NpmResolver {
  public static readonly RENODEMODULES: RegExp = /^[\/]*node_modules\//;
  public static readonly EXTENTIONS: string[] = ['.js', '.es6'];
  public static readonly NOMODULE: string[] = ['.', '/'];
  public readonly is: NpmIs;
  public readonly fsCache: Cachator;
  public readonly root: string;
  public readonly searchPath: string[];
  public readonly currentRelFname: string;
  public readonly inFname: string;
  public readonly searchResolves: Map<string, Resolved[]>;
  public resolves: Resolved[];
  // public error?: any;

  public static toRelDirectory(rc: Cachator, root: string, currentRelFname: string): string {
    const fname = path.join(root, currentRelFname);
    const state = rc.statSync(fname);
    if (state && state.isDirectory()) {
      return currentRelFname;
    }
    return path.dirname(currentRelFname);
  }

  public static create(rc: Cachator, root: string, searchPath: string[],
    currentRelFname: string, inFname: string): NpmResolver {
    const workFname = inFname.length ? inFname : '.';
    const workCurrentRelFname = currentRelFname.length ? currentRelFname : '/';
    const relModulePath = path.join(workCurrentRelFname, workFname);
    const isRelInFname = this.NOMODULE.includes(workFname.substr(0, 1));
    const isRelCurrentRelFname = this.NOMODULE.includes(workCurrentRelFname.substr(0, 1));
    // console.log(`>>>:relPath=${relModulePath}:currentFname=${workCurrentRelFname}:inFname=${inFname}`);
    if (NpmResolver.RENODEMODULES.test(relModulePath)) {
      // started with /node_modules is a module
      const modulePath = relModulePath.replace(NpmResolver.RENODEMODULES, '');
      // console.log(`started with node_modules:${modulePath}`);
      const nfr = new NpmResolver(rc, root, searchPath, workCurrentRelFname, NpmIs.MODULE, inFname);
      nfr.loopSearchPath(searchPath, '', modulePath, 0);
      return nfr;
    } else if (!isRelInFname) {
      // current inFname is a module
      // console.log(`inFname is module:${inFname}`);
      const nfr = new NpmResolver(rc, root, searchPath, workCurrentRelFname, NpmIs.MODULE, inFname);
      nfr.loopSearchPath(searchPath, '', workFname, 0);
      return nfr;
    } else if (!isRelCurrentRelFname && isRelInFname) {
      // current is a module and path is relative
      // console.log(`currentRelFname is module:${currentRelFname} and ${inFname}`);
      const moduleResolv = new NpmResolver(rc, root, searchPath, '', NpmIs.MODULE, currentRelFname);
      moduleResolv.loopSearchPath(searchPath, '', currentRelFname, 0);
      if (!moduleResolv.found()) {
        return moduleResolv;
      }
      const modpath = path.join(path.dirname(moduleResolv.resolved().rel), inFname);
      const nfr = new NpmResolver(rc, root, searchPath, currentRelFname, NpmIs.MODULE, inFname);
      nfr.loopSearchPath(searchPath, '', modpath, 0);
      // console.log('nfr:', moduleResolv.resolved().rel, nfr.resolved().rel, nfr.module());
      return nfr;
    } else {
      // console.log(`INFNAME:${inFname}`);
      const currentRelDir = NpmResolver.toRelDirectory(rc, root, currentRelFname);
      const nfr = new NpmResolver(rc, root, searchPath, currentRelFname, NpmIs.FILE, inFname);
      nfr.loopSearchPath([root].concat(searchPath), currentRelDir, workFname, 0);
      return nfr;
    }
  }

  public createTestNames(root: string, relDir: string, inFname: string): (() => Resolved)[] {
    const relDirectory = path.join(relDir, inFname);
    const absDirectory = path.join(root, relDirectory);
    const absDirectoryStat = this.fsCache.statSync(absDirectory);
    if (absDirectoryStat) {
      if (absDirectoryStat.isDirectory()) {
        // console.log(`createName:Dir:${absDirectory}:${relDirectory}`);
        return [
          Resolved.package(this.fsCache, root, relDirectory),
          Resolved.file(root, relDirectory, 'index')
        ];
      }
      // console.log(`createName:Found:${inFname}`);
      return [
        Resolved.found(root, relDir, inFname)
      ];
    }
    if (NpmResolver.EXTENTIONS.includes(path.extname(inFname))) {
      return [Resolved.notFound(root, relDir, inFname)];
    }
    return NpmResolver.EXTENTIONS.map(ext => Resolved.file(root, relDir, inFname, ext));
  }

  public loopSearchPath(searchPath: string[], relDir: string, inFname: string, sidx: number): Resolved {
    if (sidx >= searchPath.length) {
      return null;
    }
    return this.loopNames(searchPath, relDir, inFname, sidx,
      this.createTestNames(searchPath[sidx], relDir, inFname), 0);
  }

  public findFile(dir: string, base: string): string {
    // found direct file
    const absFname = path.join(dir, base);
    try {
      const stat = this.fsCache.statSync(absFname);
      if (!stat || stat.isFile()) {
        return absFname;
      }
    } catch (e) {
      /* not found */
    }
    return null;
    // found direct file
  }

  public loopNames(searchPath: string[], relDir: string, inFname: string, sidx: number,
    names: (() => Resolved)[], nidx: number): Resolved {
    if (nidx >= names.length) {
      return this.loopSearchPath(searchPath, relDir, inFname, sidx + 1);
    }
    const resolved = names[nidx]();
    let resolves = this.searchResolves.get(searchPath[sidx]);
    if (!resolves) {
      resolves = [];
      this.searchResolves.set(searchPath[sidx], resolves);
      this.resolves = resolves;
    }
    resolves.push(resolved);
    if (resolved.error ||
        resolved.found == NpmFoundState.FOUND ||
        resolved.found == NpmFoundState.NOTFOUND) {
      if (resolved.found == NpmFoundState.NOTFOUND && sidx < searchPath.length - 1) {
        // console.log(`loopSearchPath`);
        return this.loopSearchPath(searchPath, relDir, inFname, sidx + 1);
      }
      return resolved;
    }
    // console.log(`loopNames:${relDir}:${JSON.stringify(resolved, null, 2)}`);
    const ret = this.loopNames(searchPath, relDir, inFname, sidx,
      this.createTestNames(searchPath[sidx], resolved.relDir, resolved.inFname), 0);
    if (ret) {
      return ret;
    }
    return this.loopNames(searchPath, relDir, inFname, 0, names, nidx + 1);
  }

  public constructor(rc: Cachator, root: string, searchPath: string[],
    currentRelFname: string, is: NpmIs, inFname: string) {
    this.is = is;
    this.fsCache = rc;
    this.root = root;
    this.searchPath = searchPath;
    this.currentRelFname = currentRelFname;
    this.inFname = inFname;
    this.searchResolves = new Map<string, Resolved[]>();
    this.resolves = null;
  }

  public redirected(): boolean {
    return this.found() && this.resolves.length > 1;
  }
  public resolved(): NpmRelAbs {
    const last = this.resolves[this.resolves.length - 1];
    const relFname = path.join(last.relDir, last.inFname);
    const absFname = path.join(last.root, relFname);
    return {
      rel: relFname,
      abs: absFname
    };
  }

  public found(): boolean {
    return this.resolves[this.resolves.length - 1].found == NpmFoundState.FOUND;
  }

  public module(): boolean {
    return this.is == NpmIs.MODULE;
    // path.join(this.currentRelFname).startsWith('node_modules') ||
    //       !(this.inFname.substr(0, 1) == '.');
  }

  public error(): boolean {
    return this.resolves.map(r => r.error).filter(i => i).length > 1;
  }

  public isPath(): string {
    if (this.is == NpmIs.FILE) {
      return this.resolved().rel;
    } else {
      return path.join('/node_modules', this.resolved().rel);
    }
  }

  public asVar(): string {
    return this.inFname.replace(/([^A-Za-z0-9]+)/g, '_');
  }

}
