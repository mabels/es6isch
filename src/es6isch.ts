import * as path from 'path';
import * as express from 'express';
import { Cachator } from './cachator';
// import { Resolver } from './resolver';
import { Vfs } from './types/vfs';
import { NpmResolver } from './npm-resolver';

const Module = require('module');
// const nodeLibs = require('node-libs-browser');

export class Es6isch {
  // public readonly parseCache: ParseCache;
  public readonly cachator: Cachator;
  public readonly modulePaths: string[];
  public readonly rootDir: string;

  public static app(vfs: Vfs): express.Express {
    const es6isch = new Es6isch(vfs.root.abs);
    const eapp = express();
    const expStatic = express.static(vfs.root.abs);
    eapp.use('/', (req, res) => {
      const resolv = es6isch.resolve('/', req.url, req.baseUrl);
      // console.log(`resolv:${JSON.stringify(resolv, null, 2)}`);
      if (!resolv.found()) {
        // console.log(`XXXXX:${req.url}:${JSON.stringify(resolv)}`);
        res.statusCode = 404;
        res.end();
        return;
      }
      if (resolv.redirected()) {
        res.statusCode = 302;
        // console.log(req.baseUrl);
        res.setHeader('Location', path.join(req.baseUrl, resolv.resolved().rel));
      } else {
        if (!['.es6', '.js'].find(i => req.url.endsWith(i))) {
          return expStatic(req, res, () => { console.log(`next:${req.url}`); });
        } else {
          res.setHeader('Content-type', 'application/javascript');
          const transformed = es6isch.cachator.transform(resolv);
          if (!transformed.found()) {
            res.statusCode = 409;
          }
          res.send(transformed.transformed);
        }
      }
      res.end();
    });
    return eapp;
  }

  constructor(rootDir: string, ttl = 2000) {
    // this.parseCache = new ParseCache();
    this.cachator = new Cachator(ttl);
    this.rootDir = rootDir;
    this.modulePaths = Module._nodeModulePaths(rootDir);
  }

  public resolve(currentRelFname: string, inFname: string, redirectBase = '/'): NpmResolver {
    // return Resolver.create(this.cachator, redirectBase,
      // this.rootDir, this.modulePaths, currentRelFname, inFname);
    return this.cachator.npmResolver(redirectBase, this.rootDir, this.modulePaths, currentRelFname, inFname);
  }

}
