import { NpmRelAbs } from './npm-resolver';

class ModuleCache {
  // inFname, string
  public readonly moduleCache: Map<string, NpmRelAbs>;

  constructor() {
    this.moduleCache = new Map<string, NpmRelAbs>();
  }

}
