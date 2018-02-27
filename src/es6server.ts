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
      describe: 'path to html base which should es6isch served'
    })
    .option('root-abs-base', {
      alias: 'r',
      describe: 'path to package base which should es6isch served',
      default: process.cwd()
    })
    .option('es6isch-base', {
      alias: 'e',
      describe: 'path to es6isch root',
      default: '/es6isch'
    })
    .option('modules-abs-base', {
      alias: 'm',
      describe: 'path to node_modules which should es6isch served'
    })
    .option('modules-base', {
      alias: 'm',
      describe: 'path to node_modules which should es6isch served',
      default: '/node_modules'
    })
    .parse(args);

  const vfs = Es6ischVfs.from({
    rootAbsBase: argv.rootAbsBase,
    moduleAbsBase: argv.nodeModules,
    es6ischBase: argv.es6ischBase,
    modulesBase: argv.modulesBase,
  });
  const app = express();

  if (argv.htmlBase) {
    app.use('/', express.static(argv.htmlBase));
  }
  app.use(Es6App(vfs));

  return app.listen(argv.port, argv.listenAddr, () => {
    console.log([
      `We speak es6isch on [${argv.listenAddr}:${argv.port}]`,
      `mounted on: ${vfs.root.absBase}:${vfs.root.relBase}`,
      `modules on: ${vfs.modules.absBase}:${vfs.modules.relBase}`,
      `html on: ${argv.htmlBase}`
    ].join('\n'));
  });
}
