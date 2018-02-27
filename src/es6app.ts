import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Es6ischVfs, Es6isch } from './es6isch';
import { transform } from './es6parse';

export function es6app(vfs: Es6ischVfs): express.Express {
  const app = express();
  app.use(vfs.es6ischBase, (req, res) => {
    if (path.extname(req.url) === '.map') {
      res.send('');
      return;
    }

    // const fsPath = `./${req.url}`;
    // console.log(fsPath, JSON.stringify(vfs, null, 2));
    res.setHeader('Content-type', 'application/javascript');
    const resolv = Es6isch.resolve(vfs, req.url);
    if (resolv.isError) {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (resolv.redirected) {
      res.statusCode = 302;
      // console.log(req.baseUrl);
      res.setHeader('Location', path.join(req.baseUrl, resolv.redirected));
      res.end();
      return;
    }
    res.send(transform(resolv).parsed);
    res.end();
  });
  return app;
}

export default es6app;
