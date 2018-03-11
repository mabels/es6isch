import * as fs from 'fs';
import * as path from 'path';

export interface PackageJsonSchema {
  name: string;
  main: string;
  browser?: string;
  packageJsonFname?: string;
  error?: Error;
}

export class PackageJson {
  private readonly pjson: PackageJsonSchema;

  public static read(pjdir: string): PackageJson {
    let pjFname = pjdir;
    if (!pjdir.endsWith('package.json')) {
      pjFname = path.join(pjdir, 'package.json');
    }
    try {
      const ret = JSON.parse(fs.readFileSync(pjFname).toString());
      return new PackageJson({
        ...ret,
        packageJsonFname: pjFname
      });
    } catch (e) {
      return new PackageJson({
        name: 'empty',
        main: 'index',
        packageJsonFname: pjFname,
        error: e
      });
    }
  }

  public static find(str: string): string {
    // console.log(`PackageJson:find-1:${str}`);
    if (str.length === 0) { return null; }
    const stat = fs.statSync(str);
    if (!stat) {
      // console.log(`PackageJson:find-2:${str}`);
      throw new Error(`this must be somewhere ${str}`);
    }
    const base = stat.isDirectory() ? str : path.dirname(str);
    // console.log(`PackageJson:find-3:${str}:${base}`);
    const pjson = path.join(base, 'package.json');
    const ret = fs.existsSync(pjson);
    // console.log(`PackageJson:find-4:${str}:${pjson}:${ret}:${base}`);
    if (!ret) {
      if (base != path.dirname(base)) {
        return this.find(path.dirname(base));
      } else {
        return null;
      }
    }
    return base;
  }

  constructor(pjs: PackageJsonSchema) {
    this.pjson = pjs;
  }

  public get name(): string {
    return this.pjson.name;
  }

  public browserMain(): string {
    const ret = this.pjson.browser || this.pjson.main || './index';
    // console.log(`browserMain:${ret}:${this.pjson.browser}:${this.pjson.main}:${this.pjson.packageJsonFname}
    //   ${this.pjson.error}`);
    return ret;
  }

}
