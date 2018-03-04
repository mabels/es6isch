import * as fs from 'fs';
import { NpmRelAbs, NpmResolver } from './npm-resolver';
import { Transform } from '.';

export class Timestamped<T> {
  public timeStamp: number;
  public data: T;
  constructor(data: T) {
    this.timeStamp = Date.now();
    this.data = data;
  }
}

export class Cache<K, T> {
  public readonly ttl: number;
  public readonly cache: Map<K, Timestamped<T>>;

  constructor(ttl: number) {
    this.ttl = ttl;
    this.cache = new Map<K, Timestamped<T>>();
  }

  public get(key: K, res: (k: K) => T): T {
    let ret = this.cache.get(key);
    if (!ret) {
      let data = null;
      try {
        data = res(key);
      } catch (e) {
        /* */
      }
      ret = new Timestamped(data);
      this.cache.set(key, ret);
    } else {
      const now = Date.now();
      if (now - ret.timeStamp >= this.ttl) {
        this.cache.delete(key);
        return this.get(key, res);
      }
    }
    return ret.data;
  }

}

export class Cachator {
  // relDirectory inFname, string
  // public readonly relDirectoryCache: Map<string, Map<string, NpmRelAbs>>;
  private readonly jsonCache: Cache<string, any>;
  private readonly statCache: Cache<string, fs.Stats>;
  private readonly readFileCache: Cache<string, any>;
  private readonly npmResolverCache: Cache<string, NpmResolver>;
  private readonly transformCache: Cache<string, Transform>;
  private readonly cacheTTL: number;

  constructor(cacheTTL: number) {
    // this.relDirectoryCache = new Map<string, Map<string, NpmRelAbs>>();
    this.statCache = new Cache<string, fs.Stats>(cacheTTL);
    this.jsonCache = new Cache<string, any>(cacheTTL);
    this.readFileCache = new Cache<string, any>(cacheTTL);
    this.npmResolverCache = new Cache<string, NpmResolver>(cacheTTL);
    this.transformCache = new Cache<string, Transform>(cacheTTL);
  }

  public statSync(fname: string): fs.Stats {
    return this.statCache.get(fname, fs.statSync);
  }

  public readFileSync(fname: string): any {
    return this.readFileCache.get(fname, (f) => fs.readFileSync);
  }

  public readJsonFile(fname: string): any {
    return this.jsonCache.get(fname, (f) => JSON.parse(fs.readFileSync(f).toString()));
  }

  public npmResolver(rootDir: string, mPaths: string[], currentRelFname: string, inFname: string): NpmResolver {
    const key = [currentRelFname, inFname, rootDir].concat(mPaths).join('/');
    return this.npmResolverCache.get(key, () => NpmResolver.create(this, rootDir, mPaths, currentRelFname, inFname));
  }

  public transform(base: NpmResolver): Transform {
    return this.transformCache.get(base.resolved().abs, (fname) => {
      const file = this.readFileSync(base.resolved().abs).toString();
      return Transform.fromString(this, base, file);
    });
  }

}
