import { MappedPath } from './mapped-path';
import { Param } from './param';
import * as path from 'path';

export class Vfs {
  public readonly root: MappedPath;
  public readonly modules: MappedPath;
  public readonly es6ischBase: string;

  public static from(param: Param): Vfs {
    return new Vfs(param.rootAbsBase, param.moduleAbsBase, param.es6ischBase, param.modulesBase);
  }

  public constructor(rootAbsBase: string, modulesAbsBase?: string,
    es6ischBase = '/es6isch', moduleBase = '/node_modules') {
    this.root = new MappedPath(rootAbsBase, '/');
    if (modulesAbsBase) {
      this.modules = new MappedPath(modulesAbsBase, moduleBase);
    } else {
      this.modules = new MappedPath(path.join(rootAbsBase, moduleBase), moduleBase);
    }
    this.es6ischBase = es6ischBase;
  }

}
