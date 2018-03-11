import * as path from 'path';
import { NpmFoundState } from './npm-found-state';
import { Cachator } from '../cachator';

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
      const absPackageJson = path.join(root, relDir, 'package.json');
      const packageJson = rc.readPackageJsonFile(absPackageJson);
      return new Resolved(root, relDir, packageJson.browserMain(), null, NpmFoundState.UNDEF);
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
