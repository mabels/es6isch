import * as express from 'express';
// import { es6isch } from './es6isch';
import * as path from 'path';
import { Es6ischVfs, Es6isch } from './es6isch';
import { parse } from './es6parse';

export function es6app(vfs: Es6ischVfs, htmlBase: string): express.Express {
  const app = express();
  app.use('/', express.static(htmlBase));
  app.use('/es6isch/', (req, res) => {
    const fsPath = `./${req.url}`;
    // console.log(fsPath, JSON.stringify(vfs, null, 2));
    res.setHeader('Content-type', 'application/javascript');
    const resolv = Es6isch.resolve(vfs, fsPath);
    if (resolv.isError) {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (resolv.redirected) {
      res.statusCode = 302;
      res.setHeader('Location', path.join(req.originalUrl, resolv.redirected));
      res.end();
      return;
    }
    res.send(parse(resolv));
    res.end();
  });
  return app;
}

export default es6app;
