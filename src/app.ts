import * as express from 'express';
import * as path from 'path';
import { Es6isch } from './es6isch';
import { Vfs } from './vfs';

export function app(vfs: Vfs): express.Express {
  const es6isch = new Es6isch(vfs.root.abs);
  const eapp = express();
  const expStatic = express.static(vfs.root.abs);
  eapp.use('/', (req, res) => {
    const resolv = es6isch.resolve('/', req.url, req.baseUrl);
    // console.log(`resolv:${JSON.stringify(resolv, null, 2)}`);
    if (!resolv.npmResolver.found()) {
      // console.log(`XXXXX:${req.url}:${JSON.stringify(resolv)}`);
      res.statusCode = 404;
      res.end();
      return;
    }
    if (resolv.npmResolver.redirected()) {
      res.statusCode = 302;
      // console.log(req.baseUrl);
      res.setHeader('Location', path.join(req.baseUrl, resolv.npmResolver.resolved().rel));
    } else {
      if (!['.es6', '.js'].find(i => req.url.endsWith(i))) {
        return expStatic(req, res, () => { console.log(`next:${req.url}`); });
      } else {
        res.setHeader('Content-type', 'application/javascript');
        const transformed = resolv.transform();
        if (!transformed.found()) {
          res.statusCode = 409;
        }
        res.send(transformed.transformed);
      }
    }
    res.end();
  });
  return eapp;
}

// export default es6app;
