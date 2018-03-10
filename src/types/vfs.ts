import { MappedPath } from './mapped-path';
import * as path from 'path';

export interface VfsParam {
  rootAbsBase: string;
  moduleAbsBase?: string;
  es6ischBase?: string;
  modulesBase?: string;
}

export class Vfs {
  public readonly root: MappedPath;
  public readonly modules: MappedPath;
  public readonly es6ischBase: string;

  public static from(param: VfsParam): Vfs {
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
