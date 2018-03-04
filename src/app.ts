import * as express from 'express';
import * as path from 'path';
import { Es6isch } from './es6isch';
import { Vfs } from './vfs';

export function app(vfs: Vfs): express.Express {
  const es6isch = new Es6isch(vfs.root.abs);
  const eapp = express();
  eapp.use(vfs.es6ischBase, (req, res) => {
    const resolv = es6isch.resolve('/', req.url);
    if (!resolv.npmResolver.found()) {
      console.log(`XXXXX:${req.url}:${JSON.stringify(resolv)}`);
      res.statusCode = 404;
      res.end();
      return;
    }
    if (resolv.npmResolver.redirected()) {
      res.statusCode = 302;
      // console.log(req.baseUrl);
      res.setHeader('Location', path.join(req.baseUrl, resolv.npmResolver.resolved().rel));
    } else {
      if (req.url.endsWith('.map')) {
        try {
          res.send(es6isch.cachator.readFileSync(resolv.npmResolver.resolved().abs));
        } catch (e) {
          // console.log(`XXXXX:${resolv.npmResolver.resolved().abs}`);
          res.statusCode = 405;
          res.send(e);
        }
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
