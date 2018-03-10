import { Timestamped } from './timestamped';

export class Cache<K, T> {
  public readonly ttl: number;
  public readonly cache: Map<K, Timestamped<T>>;

  constructor(ttl: number) {
    this.ttl = ttl;
    this.cache = new Map<K, Timestamped<T>>();
  }

  public get(key: K, res: (k: K) => T): T {
    let ret = this.cache.get(key);
    if (!ret) {
      // console.log(`1:${key}`);
      let data = null;
      try {
        // console.log(`2:${key}`);
        data = res(key);
        // console.log(`3:${key}:${data ? 'OK' : 'NULL'}`);
      } catch (e) {
        /* */
        // console.log(`X:${key}${e}:${res}`);
      }
      // console.log(`3.1:${key}`);
      ret = new Timestamped(data);
      // console.log(`4:${key}`);
      this.cache.set(key, ret);
      // console.log(`5:${key}`);
    } else {
      const now = Date.now();
      if ((now - ret.timeStamp) >= this.ttl) {
        this.cache.delete(key);
        // console.log(`TTL-LOOP`);
        return this.get(key, res);
      }
    }
    // if (!ret.data) {
      // console.log(`RES:${key}`);
    // }
    return ret.data;
  }

}
