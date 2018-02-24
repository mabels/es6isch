import * as express from 'express';
import { es6isch } from './es6isch';
import * as path from 'path';

export function es6app(pkgBase: string): express.Express {
  const app = express();
  app.use('/', express.static('./html'));
  app.use('/es6isch/', (req, res) => {
    const fsPath = './' + req.url;
    console.log(fsPath);
    try {
      res.setHeader('content-type', 'application/javascript');
      res.send(es6isch(pkgBase, fsPath));
      res.end();
    } catch (e) {
      console.log(e);
      res.statusCode = 404;
      res.end();
    }
  });
  return app;
}

export default es6app;
