import * as express from 'express';
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
    const transformed = transform(resolv);
    if (transformed.isError()) {
      res.statusCode = 409;
    }
    res.send(transformed.parsed);
    res.end();
  });
  return app;
}

export default es6app;
