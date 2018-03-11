import * as path from 'path';
import * as fs from 'fs';
import { NpmIs } from './types/npm-is';
import { Resolved } from './types/resolved';
import { NpmResolver, NpmResolverCreateParam } from './npm-resolver';
import { PackageJson } from './types/package-json';

let nodeLibsInjectorSingleTon: Map<string, NpmResolver> = null;

export function attachNodeLibsInjector(nrp: NpmResolverCreateParam): NpmResolverCreateParam {
    // console.log('--1');
    if (nodeLibsInjectorSingleTon) {
      // console.log('--2');
      nrp.injectRedirects = nodeLibsInjectorSingleTon;
      return nrp;
    }
    // console.log('--3');
    nodeLibsInjectorSingleTon = new Map<string, NpmResolver>();
    const ir = require('node-libs-browser');
    // console.log('--4');
    for (const modName in ir) {
      const modPath = ir[modName];
      if (modPath) {
        const packageJsonDir = PackageJson.find(modPath);
        const packageJson = PackageJson.read(packageJsonDir);
        const searchPath = packageJsonDir.slice(0, -packageJson.name.length);
        const moduleReq = path.join(packageJson.name, path.relative(packageJsonDir, modPath));
        const nfr = new NpmResolver({
          ...nrp,
          // root: packageJsonDir,
          searchPath: [searchPath],
          currentRelFname: '',
          is: NpmIs.MODULE,
          inFname: modName
        });
        const nodeMod = Resolved.package(nrp.fsCache, searchPath, modName)();
        nfr.pushResolved(searchPath, nodeMod);
        const found = Resolved.found(searchPath, '', moduleReq)();
        nfr.pushResolved(searchPath, found);
        nodeLibsInjectorSingleTon.set(modName, nfr);
      }
    }
    nrp.injectRedirects = nodeLibsInjectorSingleTon;
    return nrp;
  }
