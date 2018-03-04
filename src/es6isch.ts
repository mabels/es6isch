import { ParseCache } from './parse-cache';
import { Cachator } from './cachator';
import { Resolver } from './resolver';

const Module = require('module');
// const nodeLibs = require('node-libs-browser');

export class Es6isch {
  public readonly parseCache: ParseCache;
  public readonly cachator: Cachator;
  public readonly modulePaths: string[];
  public readonly rootDir: string;

  constructor(rootDir: string, ttl = 2000) {
    this.parseCache = new ParseCache();
    this.cachator = new Cachator(ttl);
    this.rootDir = rootDir;
    this.modulePaths = Module._nodeModulePaths(rootDir);
  }

  public resolve(currentRelFname: string, inFname: string): Resolver {
    return Resolver.create(this.cachator, this.rootDir, this.modulePaths, currentRelFname, inFname);
  }

}
