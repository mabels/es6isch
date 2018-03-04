import { assert } from 'chai';
import { Vfs, Es6isch, Transform, server, app, NpmResolver } from '../src/index';
import * as request from 'request';
import * as express from 'express';
import * as path from 'path';
import * as http from 'http';

// const cwd = process.cwd();
describe('es6sich', () => {
  // const es6isch = new Es6isch(vfs.rootDir);
  const pkgbase = new Es6isch(path.join(process.cwd(), 'test', 'pkgbase'));
  const projectBase = new Es6isch(path.join(process.cwd(), 'test', 'projectBase', 'packages', 'api'));

  describe('NpmFileResolver', () => {
    it('.', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [], '', '.');
      assert.equal(nfr.inFname, '.', 'inFname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.redirected(), true, 'error');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'resolved');
    });
    it('./doof/./hund/.././../', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [], '', './doof/./hund/.././../');
      assert.equal(nfr.inFname, './doof/./hund/.././../', 'inFname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.redirected(), true, 'error');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'resolved');
    });

    it('./murks', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [], '', './murks');
      assert.equal(nfr.inFname, './murks', 'inFname');
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'redirected');
      assert.equal(nfr.error(), false, 'error');
    });
    it('./murks.js', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [], '', './murks.js');
      assert.equal(nfr.inFname, './murks.js', 'inFname');
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'redirected');
      assert.equal(nfr.error(), false, 'error');
    });
    it('./base/wurst', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [], '', './base/wurst');
      // console.log(nfr);
      assert.equal(nfr.inFname, './base/wurst', 'fname');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'redirected');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'redirected');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'redirected');
      assert.equal(nfr.error(), false, 'error');
    });
    it('./base/wurst/index.js', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [], '', './base/wurst/index.js');
      assert.equal(nfr.inFname, './base/wurst/index.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'found');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'resolved');
    });
    it('./base/wurst/index.js:./test.js', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [], './base/wurst/index.js', './test.js');
      assert.equal(nfr.inFname, './test.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'found');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/test.js', 'resolved');
    });
    it('./base/wurst/index.js:.', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [], './base/wurst/index.js', '.');
      assert.equal(nfr.inFname, '.', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'resolved');
    });
    it('./base/wurst/index.js:./murks', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [], './base/wurst/index.js', './murks.js');
      assert.equal(nfr.inFname, './murks.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'found');
    });

    // api
    it('apilevelpkg', () => {
      const nfr = NpmResolver.create(projectBase.cachator, projectBase.rootDir, [
        path.join(projectBase.rootDir, 'node_modules'),
        path.join(projectBase.rootDir, '..', '..', 'node_modules')
      ],
        './src/test.js', 'apilevelpkg');
      assert.equal(nfr.inFname, 'apilevelpkg', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.resolved().abs, path.join(projectBase.rootDir, 'node_modules/apilevelpkg/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'apilevelpkg/test.js', 'resolved');
    });

    it('projectlevelpkg', () => {
      const nfr = NpmResolver.create(projectBase.cachator, projectBase.rootDir, [
        path.join(projectBase.rootDir, 'node_modules'),
        path.join(projectBase.rootDir, '..', '..', 'node_modules')
      ], './src/test.js', 'projectlevelpkg');
      // console.log(nfr);
      assert.equal(nfr.inFname, 'projectlevelpkg', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.resolved().abs,
        path.join(projectBase.rootDir, '../..', 'node_modules/projectlevelpkg/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'projectlevelpkg/test.js', 'resolved');
    });

    it('projectlevelpkg/test', () => {
      const nfr = NpmResolver.create(projectBase.cachator, projectBase.rootDir, [
        path.join(projectBase.rootDir, 'node_modules'),
        path.join(projectBase.rootDir, '..', '..', 'node_modules')
      ], './src/test.js', 'projectlevelpkg/test');
      assert.equal(nfr.inFname, 'projectlevelpkg/test', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.resolved().abs,
        path.join(projectBase.rootDir, '../..', 'node_modules/projectlevelpkg/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'projectlevelpkg/test.js', 'resolved');
    });

    it('projectlevelpkg/test.js', () => {
      const nfr = NpmResolver.create(projectBase.cachator, projectBase.rootDir, [
        path.join(projectBase.rootDir, 'node_modules'),
        path.join(projectBase.rootDir, '..', '..', 'node_modules')
      ], './src/test.js', 'projectlevelpkg/test.js');
      assert.equal(nfr.inFname, 'projectlevelpkg/test.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'found');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.resolved().abs,
        path.join(projectBase.rootDir, '../..', 'node_modules/projectlevelpkg/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'projectlevelpkg/test.js', 'resolved');
    });

    it('projectlevelpkg/murks.js', () => {
      const nfr = NpmResolver.create(projectBase.cachator, projectBase.rootDir, [
        path.join(projectBase.rootDir, 'node_modules'),
        path.join(projectBase.rootDir, '..', '..', 'node_modules')
      ], './src/test.js', 'projectlevelpkg/murks');
      assert.equal(nfr.inFname, 'projectlevelpkg/murks', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'found');
    });

    it('node_modules:projectlevelpkg', () => {
      const nfr = NpmResolver.create(projectBase.cachator, projectBase.rootDir, [
        path.join(projectBase.rootDir, 'node_modules'),
        path.join(projectBase.rootDir, '..', '..', 'node_modules')
      ], 'node_modules', 'projectlevelpkg');
      assert.equal(nfr.inFname, 'projectlevelpkg', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.resolved().abs,
        path.join(projectBase.rootDir, '../..', 'node_modules/projectlevelpkg/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'projectlevelpkg/test.js', 'resolved');
    });

    it('node_modules/projectlevelpkg:.', () => {
      const nfr = NpmResolver.create(projectBase.cachator, projectBase.rootDir, [
        path.join(projectBase.rootDir, 'node_modules'),
        path.join(projectBase.rootDir, '..', '..', 'node_modules')
      ], 'node_modules/projectlevelpkg', '.');
      assert.equal(nfr.inFname, '.', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.redirected(), true, 'redirected');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.module(), true, 'module');
      assert.equal(nfr.resolved().abs,
        path.join(projectBase.rootDir, '../..', 'node_modules/projectlevelpkg/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'projectlevelpkg/test.js', 'resolved');
    });

    it('node_modules/projectlevelpkg/test.js:.', () => {
      const nfr = NpmResolver.create(projectBase.cachator, projectBase.rootDir, [
        path.join(projectBase.rootDir, 'node_modules'),
        path.join(projectBase.rootDir, '..', '..', 'node_modules')
      ], 'node_modules/projectlevelpkg/test.js', '.');
      assert.equal(nfr.inFname, '.', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'redirected');
      assert.equal(nfr.resolved().abs,
        path.join(projectBase.rootDir, '../..', 'node_modules/projectlevelpkg/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'projectlevelpkg/test.js', 'resolved');
    });

    it('pkgtest', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [path.join(pkgbase.rootDir, 'node_modules')],
        './base/wurst/index.js', 'pkgtest');
      assert.equal(nfr.inFname, 'pkgtest', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'node_modules/pkgtest/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'pkgtest/test.js', 'resolved');
    });
    it('pkgtest/test.js', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [path.join(pkgbase.rootDir, 'node_modules')],
        './base/wurst/index.js', 'pkgtest/test.js');
      assert.equal(nfr.inFname, 'pkgtest/test.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'found');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'node_modules/pkgtest/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'pkgtest/test.js', 'resolved');
    });
    it('pkgtest/murks.js', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [path.join(pkgbase.rootDir, 'node_modules')],
        './base/wurst/index.js', 'pkgtest/murks');
      assert.equal(nfr.inFname, 'pkgtest/murks', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'found');
    });

    it('node_modules:pkgtest', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [path.join(pkgbase.rootDir, 'node_modules')],
        'node_modules', 'pkgtest');
      assert.equal(nfr.inFname, 'pkgtest', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'node_modules/pkgtest/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'pkgtest/test.js', 'resolved');
    });

    it('node_modules/pkgtest:.', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [path.join(pkgbase.rootDir, 'node_modules')],
        'node_modules/pkgtest', '.');
      // console.log(nfr);
      assert.equal(nfr.inFname, '.', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.redirected(), true, 'redirected');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.module(), true, 'module');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'node_modules/pkgtest/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'pkgtest/test.js', 'resolved');
    });

    it('node_modules/pkgtest:test.js', () => {
      const nfr = NpmResolver.create(pkgbase.cachator, pkgbase.rootDir, [path.join(pkgbase.rootDir, 'node_modules')],
        'node_modules/pkgtest', './test.js');
      assert.equal(nfr.inFname, './test.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'redirected');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'node_modules/pkgtest/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'pkgtest/test.js', 'resolved');
    });

  });

  describe('resolve', () => {
    it('file-resolv directory to ./unknown', () => {
      const rv = pkgbase.resolve('./unknown', 'base').npmResolver;
      assert.equal(rv.inFname, './unknown');
      assert.equal(rv.found(), false);
      assert.equal(rv.resolved(), null);
      assert.equal(rv.redirected(), false);
    });
    it('file-resolv file to ./unknown', () => {
      const rv = pkgbase.resolve('./unknown', 'base/index.html').npmResolver;
      assert.equal(rv.inFname, './unknown');
      assert.equal(rv.resolved(), null);
      assert.equal(rv.found(), false);
      assert.equal(rv.redirected(), false);
    });
    it('module-resolv directory to unknown', () => {
      const rv = pkgbase.resolve('unknown', 'base').npmResolver;
      assert.equal(rv.inFname, 'unknown');
      assert.equal(rv.found(), false);
      assert.equal(rv.resolved(), null);
      assert.equal(rv.redirected(), false);
    });
    it('module-resolv file to unknown', () => {
      const rv = pkgbase.resolve('unknown', 'base/index.html').npmResolver;
      assert.equal(rv.inFname, 'unknown');
      assert.equal(rv.found(), true);
      assert.equal(rv.redirected(), null);
      assert.equal(rv.resolved().rel, 'base/index.html');
    });

    it('resolve package.json:main + redirect', () => {
      const rv = pkgbase.resolve('/', '.').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'index.js'));
      assert.equal(rv.resolved().rel, './base/wurst/index.js');
    });
    it('resolve index.js + redirect', () => {
      const rv = pkgbase.resolve('./base/wurst/reactPackage', '.').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, './base/wurst/reactPackage/index.js', 'redirect');
    });
    it('resolve index.js + no redirect', () => {
      const rv = pkgbase.resolve('./base/wurst/reactPackage/index.js', '.').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs,
        path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, null, 'redirect');
    });

    it('resolve:base index.js + redirect', () => {
      const rv = pkgbase.resolve('.', '/base/wurst/reactPackage').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs,
        path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, './index.js', 'redirect');
    });

    it('resolve:base index.js + no redirect', () => {
      const rv = pkgbase.resolve('./index.js', '/base/wurst/reactPackage').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs,
        path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, null, 'redirect');
    });

    it('resolve:base-file index.js + redirect', () => {
      const rv = pkgbase.resolve('.', '/base/wurst/reactPackage/index.js').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs,
        path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, './index.js', 'redirect');
    });

    it('resolve:base-file index.js + no redirect', () => {
      const rv = pkgbase.resolve('./index.js', '/base/wurst/reactPackage/index.js').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, null, 'redirect');
    });

    it('resolve:base-file .. + redirect', () => {
      const rv = pkgbase.resolve('..', '/base/wurst/reactPackage/index.js').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, '../index.js', 'redirect');
    });

    it('resolve:base-file ../index.js + redirect', () => {
      const rv = pkgbase.resolve('../index.js', '/base/wurst/reactPackage/index.js').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, null, 'redirect');
    });

    it('resolve node_module no-redirect', () => {
      const rv = pkgbase.resolve('pkgtest/test.js', '/base/wurst/reactPackage/index.js').npmResolver;
      // console.log(rv);
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, null, 'redirect');
    });

    it('resolve node_module redirect', () => {
      const rv = pkgbase.resolve('pkgtest', '/base/wurst/reactPackage/index.js').npmResolver;
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, '../../../node_modules/pkgtest/test.js', 'redirect');
    });

  });
  describe('parse', () => {
    it('test import first', () => {
      const parsed = Transform.run(pkgbase.cachator,
        pkgbase.resolve('/', './base/wurst/reactPackage/index.js').npmResolver).transformed;
      // console.log(parsed);
      assert.ok(parsed.startsWith('import'));
      assert.ok(parsed.includes(`from '../../../node_modules/pkgtest/test.js';`));
    });
    it('test export default last', () => {
      const parsed = Transform.run(pkgbase.cachator,
        pkgbase.resolve('/', './base/wurst/localPackage/wurst.js').npmResolver).transformed;
      assert.ok(parsed.endsWith('export default module.exports;'));
    });
  });

  describe('test-server', () => {
    let expressSrv: http.Server;
    let port = ~~((Math.random() * (0x10000 - 1024)) + 1024);
    before(() => {
      const eapp = express();
      eapp.use('/wurst', app(Vfs.from({
        rootAbsBase: './test/projectBase/packages/api',
        es6ischBase: '/'
      })));
      expressSrv = eapp.listen(port, 'localhost', () => { /* */ });
    });

    it('absolute-redirect', (done) => {
      request(`http://localhost:${port}/wurst/`, (err, res) => {
        try {
          console.log(res.statusCode);
          console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.startsWith(
            'import * as require_apilevelpkg from \'../node_modules/apilevelpkg/test.js\''));
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    after(() => {
      expressSrv.close();
    });
  });

  describe('test-server', () => {
    let expressSrv: http.Server;
    let port = ~~((Math.random() * (0x10000 - 1024)) + 1024);
    before(() => {
      expressSrv = server(['_',
        '-p', '' + port,
        '-r', './test/projectBase/packages/api',
        '-e', '/'
      ]);
    });

    it('index-slash', (done) => {
      request(`http://localhost:${port}/`, (err, res) => {
        try {
          // console.log(res.statusCode);
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.startsWith(
            'import * as require_apilevelpkg from \'../node_modules/apilevelpkg/test.js\''));
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('index-slash-src-test.js', (done) => {
      request(`http://localhost:${port}/src/test.js`, (err, res) => {
        try {
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.startsWith(
            'import * as require_apilevelpkg from \'../node_modules/apilevelpkg/test.js\''));
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('index-slash-node-modules-apilevelpkg', (done) => {
      request(`http://localhost:${port}/node_modules/apilevelpkg`, (err, res) => {
        try {
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.startsWith(
            'import * as require_projectlevelpkg from \'../../node_modules/projectlevelpkg/test.js\';'
          ));
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('index-slash-node-modules-apilevelpkg-test.js', (done) => {
      request(`http://localhost:${port}/node_modules/apilevelpkg/test.js`, (err, res) => {
        try {
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.startsWith(
            'import * as require_projectlevelpkg from \'../../node_modules/projectlevelpkg/test.js\';'
          ));
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('index-slash-node-modules-projectlevelpkg', (done) => {
      request(`http://localhost:${port}/node_modules/projectlevelpkg`, (err, res) => {
        try {
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.includes(
            '// es6isch-project-level-pkg'
          ));
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('index-slash-node-modules-projectlevelpkg-test.js', (done) => {
      request(`http://localhost:${port}/node_modules/projectlevelpkg/test.js`, (err, res) => {
        try {
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.includes(
            '// es6isch-project-level-pkg'
          ));
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('index-soft-link.js', (done) => {
      request(`http://localhost:${port}/node_modules/@patternplate/render-styled-compoments/mount.js`, (err, res) => {
        try {
          // console.log(res.statusCode);
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.includes(
            '// @patternplate/render-styled-compoments/mount.js'
          ));
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    after(() => {
      expressSrv.close();
    });
  });

});
