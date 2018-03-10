import * as path from 'path';
import * as fs from 'fs';
import { NpmIs } from './types/npm-is';
import { Resolved } from './types/resolved';
import { NpmResolver, NpmResolverCreateParam } from './npm-resolver';

let nodeLibsInjectorSingleTon: Map<string, NpmResolver> = null;

function findPathToPackageJson(str: string): string {
  if (str.length === 0) { return null; }
  const stat = fs.statSync(str);
  if (!stat) {
    throw new Error(`this must be somewhere ${str}`);
  }
  let base = stat.isDirectory() ? str : path.dirname(str);
  const pjson = path.join(base, 'package.json');
  const ret = fs.existsSync(pjson);
  if (!ret) {
    if (base != path.dirname(base)) {
      return findPathToPackageJson(path.dirname(base));
    } else {
      return null;
    }
  }
  return base;
}

interface PackageJsonSchema {
  name: string;
  main: string;
}

function readPackageJson(pjdir: string): PackageJsonSchema {
  try {
    const ret = JSON.parse(fs.readFileSync(path.join(pjdir, 'package.json')).toString()) as PackageJsonSchema;
    ret.main = ret.main || './index';
    return ret;
  } catch (e) {
    return null;
  }
}

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
        const packageJsonDir = findPathToPackageJson(modPath);
        const packageJson = readPackageJson(packageJsonDir);
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
