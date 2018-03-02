
import * as path from 'path';
import * as fs from 'fs';
import { inflate } from 'zlib';
import { Es6ischMap } from '.';
import { resolve } from 'dns';

enum NpmFoundState {
  UNDEF = 'undef',
  FOUND = 'found',
  NOTFOUND = 'notfound'
}

export abstract class NpmResolve {
  public readonly root: string;
  public readonly relDir: string;
  public readonly inFname: string;
  public readonly redirect: boolean;
  public readonly found: NpmFoundState;
  public readonly error?: any;

  public static file(root: string, relDir: string, inFname: string, suffix = ''): () => NpmResolve {
    return () => {
      const fname = `${inFname}${suffix}`;
      // const absFname = path.join(root, relDir, fname);
      // console.log(`FileNpmResolve:${relDir}:${fname}`);
      return new FileNpmResolve(root, relDir, fname, null, NpmFoundState.UNDEF);
    };
  }

  public static found(root: string, relDir: string, inFname: string): () => NpmResolve {
    return () => {
      // console.log(`FOUND`);
      return new FileNpmResolve(root, relDir, inFname, null, NpmFoundState.FOUND);
    };
  }

  public static notFound(root: string, relDir: string, inFname: string): () => NpmResolve {
    return () => {
      // console.log(`NOTFOUND`);
      return new FileNpmResolve(root, relDir, inFname, null, NpmFoundState.NOTFOUND);
    };
  }

  public static package(root: string, relDir: string): () => NpmResolve {
    return () => {
      let packageJson: any;
      const absPackageJson = path.join(root, relDir, 'package.json');
      try {
        packageJson = JSON.parse(fs.readFileSync(absPackageJson).toString());
      } catch (e) {
        packageJson = {};
      }
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

  public abstract reResolv(cb: () => NpmResolve): NpmResolve;

  public toObj(): any {
    return this;
  }
}

export class FileNpmResolve extends NpmResolve {
  constructor(absBase: string, absFname: string, relFname: string, error: any, found: NpmFoundState) {
    super(absBase, absFname, relFname, error, found);
  }
  public reResolv(cb: () => NpmResolve): NpmResolve {
    return null;
  }
}

export class PackageNpmResolve extends NpmResolve {
  constructor(absBase: string, absFname: string, relFname: string, error: any) {
    super(absBase, absFname, relFname, error, NpmFoundState.UNDEF);
  }
  public reResolv(cb: () => NpmResolve): NpmResolve {
    return cb();
  }
}

export interface NpmSearchPath {
  path: string;
  isPackage: boolean;
  isModuleDirectory: boolean;
}

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
  public readonly root: string;
  public readonly searchPath: string[];
  public readonly currentRelFname: string;
  public readonly inFname: string;
  public readonly searchResolves: Map<string, NpmResolve[]>;
  public resolves: NpmResolve[];
  public error?: any;

  public static stat(fname: string): fs.Stats {
    try {
      return fs.statSync(fname);
    } catch (e) {
      return null;
    }
  }

  public static toRelDirectory(root: string, currentRelFname: string): string {
    const fname = path.join(root, currentRelFname);
    const state = NpmResolver.stat(fname);
    if (state && state.isDirectory()) {
      return currentRelFname;
    }
    return path.dirname(currentRelFname);
  }

  public static create(root: string, searchPath: string[],
    currentRelFname: string, inFname: string): NpmResolver {
    const nfr = new NpmResolver(root, searchPath, currentRelFname, inFname);
    const relModulePath = path.join(currentRelFname, inFname);
    if (relModulePath.startsWith('node_modules')) {
      const modulePath = relModulePath.replace(/^node_modules\//, '');
      // console.log(`NodeModules:${inFname}:${modulePath}`);
      // const currentRelDir = NpmResolver.toRelDirectory(searchPath[0], inFname);
      nfr.loopSearchPath(searchPath, '', modulePath, 0);
    } else if (inFname.substr(0, 1) == '.') {
      const currentRelDir = NpmResolver.toRelDirectory(root, currentRelFname);
      nfr.loopSearchPath([root].concat(searchPath), currentRelDir, inFname, 0);
    } else {
      // console.log(`Module:${inFname}`);
      // const currentRelDir = NpmResolver.toRelDirectory(searchPath[0], inFname);
      nfr.loopSearchPath(searchPath, '', inFname, 0);
    }
    return nfr;
  }

  public createTestNames(root: string, relDir: string, inFname: string): (() => NpmResolve)[] {
    const relDirectory = path.join(relDir, inFname);
    const absDirectory = path.join(root, relDirectory);
    const absDirectoryStat = NpmResolver.stat(absDirectory);
    if (absDirectoryStat) {
      if (absDirectoryStat.isDirectory()) {
        // console.log(`createName:Dir:${absDirectory}:${relDirectory}`);
        return [
          NpmResolve.package(root, relDirectory),
          NpmResolve.file(root, relDirectory, 'index')
        ];
      }
      // console.log(`createName:Found:${inFname}`);
      return [
        NpmResolve.found(root, relDir, inFname)
      ];
    }
    if (inFname.endsWith('.js') || inFname.endsWith('.es6')) {
      return [NpmResolve.notFound(root, relDir, inFname)];
    }
    // if isDirectory(path.join(spath, base))
    // if spath, base => isPackageRoot
    // PackageResolve(dir)
    // console.log(`createName:!state:${spath.path}:${base}`);
    return [
      // base == . or ./ or endsWith / || '/.' -> [index,[package.json]]
      NpmResolve.file(root, relDir, inFname, '.js'),
      NpmResolve.file(root, relDir, inFname, '.es6'),
    ];
  }

  public loopSearchPath(searchPath: string[], relDir: string, inFname: string, sidx: number): NpmResolve {
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
      const stat = fs.statSync(absFname);
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
    names: (() => NpmResolve)[], nidx: number): NpmResolve {
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

    // createTestNames(searchPath[sidx], relDir, inFname): (() => NpmResolve)[] {
    // const findFile = this.findFile(searchPath[sidx], path.join());
    // console.log(`findFile:${resolved.skip()}:${base}:${nidx}:FF=${findFile}:` +
    //   `${this.searchPath[idx].path}:${resolved.constructor.name}:${JSON.stringify(resolved, null, 2)}`);
    // if (findFile) {
    //   // resolved.absFname = findFile;
    //   // resolved.relFname = base;
    //   return resolved;
    // }
    // const lsp = resolved.reResolv(() => {
    //   console.log(`reResolv:${base}:${JSON.stringify(resolved.toObj(), null, 2)}:${this.searchPath[idx]}`);
    //   return NpmFileResolver.create([fileRoot(resolved.absBase)], resolved.relFname).redirected;
    //   // return null;
    // });
    // console.log(`lsp:${base}:${!!lsp}`);
    // if (lsp) {
    //   return lsp;
    // }

    // return this.loopNames(base, names, idx, nidx + 1);
  }

  public constructor(root: string, searchPath: string[],
    currentRelFname: string, inFname: string) {
    this.root = root;
    this.searchPath = searchPath;
    this.currentRelFname = currentRelFname;
    this.inFname = inFname;
    this.searchResolves = new Map<string, NpmResolve[]>();
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
    return path.join(this.currentRelFname).startsWith('node_modules') ||
           !(this.inFname.substr(0, 1) == '.');
  }

}
