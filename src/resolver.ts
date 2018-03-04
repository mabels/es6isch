import { Vfs } from './vfs';
import { MappedPath } from './mapped-path';
import { Transform } from './transform';
import { Cachator } from './cachator';
import { NpmResolver } from './npm-resolver';

export class Resolver {
  public readonly npmResolver: NpmResolver;
  private readonly cachator: Cachator;
  private transformCached: Transform;

  public static create(fc: Cachator, rootDir: string, mPaths: string[],
    currentRelFname: string, inFname: string): Resolver {
    // const npm = NpmResolver.create(fc, rootDir, mPaths, currentRelFname, inFname);
    const npm = fc.npmResolver(rootDir, mPaths, currentRelFname, inFname);
    return new Resolver(fc, npm);
  }

  public constructor(fc: Cachator, npmResolver: NpmResolver) {
    this.cachator = fc;
    this.npmResolver = npmResolver;
    this.transformCached = null;
  }

  public transform(): Transform {
    if (!this.transformCached) {
      this.transformCached = Transform.run(this.cachator, this.npmResolver);
    }
    return this.transformCached;
  }

}
