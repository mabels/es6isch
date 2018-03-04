
export class ParseCache {
  // absFname, string
  public readonly parseCache: Map<string, string>;

  constructor() {
    this.parseCache = new Map<string, string>();
  }

}
