
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

export class Resolved {
  public readonly root: string;
  public readonly relDir: string;
  public readonly inFname: string;
  // public readonly redirect: boolean;
  public readonly found: NpmFoundState;
  public readonly error?: any;

  public static file(root: string, relDir: string, inFname: string, suffix = ''): () => Resolved {
    return () => {
      const fname = `${inFname}${suffix}`;
      return new Resolved(root, relDir, fname, null, NpmFoundState.UNDEF);
    };
  }

  public static found(root: string, relDir: string, inFname: string): () => Resolved {
    return () => {
      return new Resolved(root, relDir, inFname, null, NpmFoundState.FOUND);
    };
  }

  public static notFound(root: string, relDir: string, inFname: string): () => Resolved {
    return () => {
      return new Resolved(root, relDir, inFname, null, NpmFoundState.NOTFOUND);
    };
  }

  public static package(rc: Cachator, root: string, relDir: string): () => Resolved {
    return () => {
      let packageJson: any;
      const absPackageJson = path.join(root, relDir, 'package.json');
      packageJson = rc.readJsonFile(absPackageJson) || {};
      return new Resolved(root, relDir, packageJson.main || 'index', null, NpmFoundState.UNDEF);
    };
  }

  constructor(root: string, relDir: string, inFname: string, error: any, found: NpmFoundState) {
    this.root = root;
    this.relDir = relDir;
    this.inFname = inFname;
    // this.redirect = false;
    this.found = found;
    this.error = error;
  }

  public toObj(): any {
    return this;
  }
}

export interface NpmRelAbs {
  rel: string;
  abs: string;
}

export interface NpmResolverCreateParam {
  fsCache: Cachator;
  root: string;
  searchPath: string[];
  currentRelFname: string;
  inFname: string;
  injectRedirects?: Map<string, any>;
  redirectBase?: string;
}

export interface NpmResolverParam extends NpmResolverCreateParam {
  is: NpmIs;
}

export class NpmResolver implements NpmResolverParam {
  public static readonly RENODEMODULES: RegExp = /^[\/]*node_modules\//;
  public static readonly EXTENTIONS: string[] = ['.js', '.es6'];
  public static readonly NOMODULE: string[] = ['.', '/'];
  public readonly is: NpmIs;
  public readonly fsCache: Cachator;
  public readonly root: string;
  public readonly searchPath: string[];
  public readonly currentRelFname: string;
  public readonly inFname: string;
  public readonly redirectBase?: string;
  public readonly injectRedirects: Map<string, NpmResolver>;
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

  public static create(nrp: NpmResolverCreateParam): NpmResolver {
    const workFname = nrp.inFname.length ? nrp.inFname : '.';
    const workCurrentRelFname = nrp.currentRelFname.length ? nrp.currentRelFname : '/';
    const relModulePath = path.join(workCurrentRelFname, workFname);
    const isRelInFname = this.NOMODULE.includes(workFname.substr(0, 1));
    const isRelCurrentRelFname = this.NOMODULE.includes(workCurrentRelFname.substr(0, 1));
    // console.log(`>>>:relPath=${relModulePath}:currentFname=${workCurrentRelFname}:inFname=${inFname}`);
    if (NpmResolver.RENODEMODULES.test(relModulePath)) {
      // started with /node_modules is a module
      const modulePath = relModulePath.replace(NpmResolver.RENODEMODULES, '');
      // console.log(`started with node_modules:${modulePath}`);
      const nfr = new NpmResolver({
        ...nrp,
        currentRelFname: workCurrentRelFname,
        is: NpmIs.MODULE,
        inFname: nrp.inFname
      });
      if (!nfr.injectRedirect(modulePath)) {
        nfr.loopSearchPath(nfr.searchPath, '', modulePath, 0);
      }
      return nfr;
    } else if (!isRelInFname) {
      // current inFname is a module
      // console.log(`inFname is module:${inFname}`);
      const nfr = new NpmResolver({
        ...nrp,
        currentRelFname: workCurrentRelFname,
        is: NpmIs.MODULE,
        inFname: nrp.inFname});
      if (!nfr.injectRedirect(workFname)) {
        nfr.loopSearchPath(nfr.searchPath, '', workFname, 0);
      }
      return nfr;
    } else if (!isRelCurrentRelFname && isRelInFname) {
      // current is a module and path is relative
      // console.log(`currentRelFname is module:${currentRelFname} and ${inFname}`);
      const moduleResolv = new NpmResolver({
        ...nrp,
        currentRelFname: '',
        is: NpmIs.MODULE,
        inFname: nrp.currentRelFname
      });
      if (!moduleResolv.injectRedirect(moduleResolv.inFname)) {
        moduleResolv.loopSearchPath(moduleResolv.searchPath, '', moduleResolv.inFname, 0);
      }
      if (!moduleResolv.found()) {
        return moduleResolv;
      }
      const modpath = path.join(path.dirname(moduleResolv.resolved().rel), nrp.inFname);
      const nfr = new NpmResolver({
        ...nrp,
        is: NpmIs.MODULE,
        inFname: nrp.inFname});
      if (!nfr.injectRedirect(modpath)) {
        nfr.loopSearchPath(nfr.searchPath, '', modpath, 0);
      }
      // console.log('nfr:', moduleResolv.resolved().rel, nfr.resolved().rel, nfr.module());
      return nfr;
    } else {
      // console.log(`INFNAME:${inFname}`);
      const currentRelDir = NpmResolver.toRelDirectory(nrp.fsCache, nrp.root, nrp.currentRelFname);
      const nfr = new NpmResolver({
        ...nrp,
        is: NpmIs.FILE});
      nfr.loopSearchPath([nfr.root].concat(nfr.searchPath), currentRelDir, workFname, 0);
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

  public injectRedirect(inFname: string): boolean {
    // console.log(`injectRedirect:${inFname}`);
    const redir = this.injectRedirects.get(inFname);
    if (!redir) {
      return false;
    }
    redir.resolves.forEach(rs => this.pushResolved(redir.searchPath[0], rs));
    return true;
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

  public pushResolved(spath: string, resolved: Resolved): void {
    let resolves = this.searchResolves.get(spath);
    if (!resolves) {
      resolves = [];
      this.searchResolves.set(spath, resolves);
      this.resolves = resolves;
    }
    resolves.push(resolved);
  }

  public loopNames(searchPath: string[], relDir: string, inFname: string, sidx: number,
    names: (() => Resolved)[], nidx: number): Resolved {
    if (nidx >= names.length) {
      return this.loopSearchPath(searchPath, relDir, inFname, sidx + 1);
    }
    const resolved = names[nidx]();
    this.pushResolved(searchPath[sidx], resolved);
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

  public constructor(npr: NpmResolverParam) {
    this.is = npr.is;
    this.fsCache = npr.fsCache;
    this.root = npr.root;
    this.searchPath = npr.searchPath;
    this.currentRelFname = npr.currentRelFname;
    this.inFname = npr.inFname;
    this.redirectBase = npr.redirectBase;
    this.searchResolves = new Map<string, Resolved[]>();
    this.injectRedirects = npr.injectRedirects || (new Map<string, any>());
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
      return path.join(path.join(this.redirectBase || '/', '/node_modules'), this.resolved().rel);
    }
  }

  public asVar(): string {
    return this.inFname.replace(/([^A-Za-z0-9]+)/g, '_');
  }

}
