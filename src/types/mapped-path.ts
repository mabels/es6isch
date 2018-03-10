import * as path from 'path';

export class MappedPath {
  public readonly rel: string; // '/';
  public readonly abs: string; // '/test/jojo';

  public constructor(absBase: string, relBase: string) {
    this.abs = path.resolve(absBase);
    if (!relBase.startsWith('/')) {
      throw new Error('Es6ischMap has to start with a /');
    }
    this.rel = relBase;
  }
}
