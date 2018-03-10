import * as fs from 'fs';
import { NpmResolver } from './npm-resolver';
import { Transform } from './transform';
import { attachNodeLibsInjector } from './node-libs-injector';
// import { nodeLibsInjector } from './node-libs-injector';

import { Cache } from './types/cache';

export class Cachator {
  // relDirectory inFname, string
  // public readonly relDirectoryCache: Map<string, Map<string, NpmRelAbs>>;
  private readonly jsonCache: Cache<string, any>;
  private readonly statCache: Cache<string, fs.Stats>;
  private readonly readFileCache: Cache<string, any>;
  private readonly npmResolverCache: Cache<string, NpmResolver>;
  private readonly transformCache: Cache<string, Transform>;
  // private readonly cacheTTL: number;

  constructor(cacheTTL: number) {
    // this.relDirectoryCache = new Map<string, Map<string, NpmRelAbs>>();
    this.statCache = new Cache<string, fs.Stats>(cacheTTL);
    this.jsonCache = new Cache<string, any>(cacheTTL);
    this.readFileCache = new Cache<string, any>(cacheTTL);
    this.npmResolverCache = new Cache<string, NpmResolver>(cacheTTL);
    this.transformCache = new Cache<string, Transform>(cacheTTL);
  }

  public statSync(fname: string): fs.Stats {
    return this.statCache.get(fname, (f) => fs.statSync(f));
  }

  public readFileSync(fname: string): any {
    return this.readFileCache.get(fname, (f) => fs.readFileSync(f));
  }

  public readJsonFile(fname: string): any {
    return this.jsonCache.get(fname, (f) => JSON.parse(fs.readFileSync(f).toString()));
  }

  public npmResolver(redirectBase: string, rootDir: string,
    mPaths: string[], currentRelFname: string, inFname: string): NpmResolver {
    const key = [currentRelFname, inFname, rootDir].sort().concat(mPaths).join('/');
    return this.npmResolverCache.get(key, () => NpmResolver.create(attachNodeLibsInjector({
      fsCache: this,
      root: rootDir,
      searchPath: mPaths,
      currentRelFname: currentRelFname,
      inFname: inFname,
      redirectBase: redirectBase,
    })));
  }

  public transform(base: NpmResolver): Transform {
    return this.transformCache.get(base.resolved().abs, (fname) => {
      const fcontent = this.readFileSync(fname).toString();
      const trans = Transform.fromString(this, base, fcontent);
      // console.log(`base:${base.resolved().abs}:${fcontent.length}:${!!trans}`);
      return trans;
    });
  }

}
