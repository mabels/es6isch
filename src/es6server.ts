import * as express from 'express';
import Es6App from './es6app';
import { Es6ischVfs } from './es6isch';
import * as path from 'path';
import * as http from 'http';

const yargs = require('yargs');

export function server(args: string[]): http.Server {
  const argv = yargs
    .option('port', {
      alias: 'p',
      describe: 'port of the server',
      default: 3000
    })
    .option('listen-addr', {
      alias: 'l',
      describe: 'listen addr',
      default: 'localhost'
    })
    .option('html-base', {
      alias: 'h',
      describe: 'path to html base which should es6isch served',
      default: process.cwd()
    })
    .option('root-base', {
      alias: 'r',
      describe: 'path to package base which should es6isch served',
      default: process.cwd()
    })
    .option('node-modules', {
      alias: 'm',
      describe: 'path to node_modules which should es6isch served',
      default: path.join(process.cwd(), 'node_modules')
    })
    .parse(args);

  const vfs = new Es6ischVfs(argv.rootBase, argv.nodeModules);
  const app = express();

  app.use(Es6App(vfs, argv.htmlBase));

  return app.listen(argv.port, argv.listenAddr, () => {
    console.log([
      `We speak es6isch on [${argv.listenAddr}:${argv.port}]`,
      `mounted on: ${argv.rootBase}`,
      `modules on: ${argv.nodeModules}`,
      `html on: ${argv.htmlBase}`
    ].join('\n'));
  });
}
