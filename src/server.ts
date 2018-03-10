import * as express from 'express';
import { Es6isch, Vfs } from './index';
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
      alias: 'n',
      describe: 'path to node_modules which should es6isch served',
      default: '/node_modules'
    })
    .parse(args);

  const vfs = Vfs.from({
    rootAbsBase: argv.rootAbsBase,
    moduleAbsBase: argv.nodeModules,
    es6ischBase: argv.es6ischBase,
    modulesBase: argv.modulesBase,
  });
  const eapp = express();

  eapp.use(Es6isch.app(vfs));

  return eapp.listen(argv.port, argv.listenAddr, () => {
    console.log([
      `We speak es6isch on [${argv.listenAddr}:${argv.port}]`,
      `mounted on: ${vfs.root.abs}:${vfs.root.rel}`,
      `modules on: ${vfs.modules.abs}:${vfs.modules.rel}`,
      argv.htmlBase ? `html on: ${argv.htmlBase}` : null
    ].filter(i => i).join('\n'));
  });
}
