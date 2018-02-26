import { assert } from 'chai';
import { Es6ischVfs, Es6isch } from '../src/es6isch';
import { parse } from '../src/es6parse';
import { server } from '../src/es6server';
import * as request from 'request';
// import * as express from 'express';
import * as path from 'path';
import * as http from 'http';

// const cwd = process.cwd();
describe('es6sich', () => {
  const vfs = new Es6ischVfs(path.join(process.cwd(), 'test', 'pkgbase'),
    path.join(process.cwd(), 'test', 'pkgbase', 'node_modules_test'));
  describe('resolve', () => {
    it('file-resolv directory to ./unknown', () => {
      const rv = Es6isch.resolve(vfs, './unknown', 'base');
      assert.equal(rv.req.toResolv, './unknown');
      assert.equal(rv.isError, true);
      assert.equal(rv.absResolved, null);
      assert.equal(rv.redirected, null);
    });
    it('file-resolv file to ./unknown', () => {
      const rv = Es6isch.resolve(vfs, './unknown', 'base/index.html');
      assert.equal(rv.req.toResolv, './unknown');
      assert.equal(rv.absResolved, null);
      assert.equal(rv.isError, true);
      assert.equal(rv.redirected, null);
    });
    it('module-resolv directory to unknown', () => {
      const rv = Es6isch.resolve(vfs, 'unknown', 'base');
      assert.equal(rv.req.toResolv, 'unknown');
      assert.equal(rv.isError, true);
      assert.equal(rv.absResolved, null);
      assert.equal(rv.redirected, null);
    });
    it('module-resolv file to unknown', () => {
      const rv = Es6isch.resolve(vfs, 'unknown', 'base/index.html');
      assert.equal(rv.req.toResolv, 'unknown');
      assert.equal(rv.absResolved, null);
      assert.equal(rv.isError, true);
      assert.equal(rv.redirected, null);
    });

    it('resolve package.json:main + redirect', () => {
      const rv = Es6isch.resolve(vfs, '.');
      assert.equal(rv.isError, false, 'error');
      assert.equal(typeof (rv.absResolved), 'string');
      assert.equal(rv.absResolved, path.join(vfs.root.absBase, 'base', 'wurst', 'index.js'));
      assert.equal(rv.redirected, './base/wurst/index.js');
    });
    it('resolve index.js + redirect', () => {
      const rv = Es6isch.resolve(vfs, './base/wurst/reactPackage');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved,
        path.join(vfs.root.absBase, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.redirected, './base/wurst/reactPackage/index.js', 'redirect');
    });
    it('resolve index.js + no redirect', () => {
      const rv = Es6isch.resolve(vfs, './base/wurst/reactPackage/index.js');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved,
        path.join(vfs.root.absBase, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.redirected, null, 'redirect');
    });

    it('resolve:base index.js + redirect', () => {
      const rv = Es6isch.resolve(vfs, '.', '/base/wurst/reactPackage');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved,
        path.join(vfs.root.absBase, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.redirected, './index.js', 'redirect');
    });

    it('resolve:base index.js + no redirect', () => {
      const rv = Es6isch.resolve(vfs, './index.js', '/base/wurst/reactPackage');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved,
        path.join(vfs.root.absBase, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.redirected, null, 'redirect');
    });

    it('resolve:base-file index.js + redirect', () => {
      const rv = Es6isch.resolve(vfs, '.', '/base/wurst/reactPackage/index.js');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved,
        path.join(vfs.root.absBase, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.redirected, './index.js', 'redirect');
    });

    it('resolve:base-file index.js + no redirect', () => {
      const rv = Es6isch.resolve(vfs, './index.js', '/base/wurst/reactPackage/index.js');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved,
        path.join(vfs.root.absBase, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.redirected, null, 'redirect');
    });

    it('resolve:base-file .. + redirect', () => {
      const rv = Es6isch.resolve(vfs, '..', '/base/wurst/reactPackage/index.js');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved,
        path.join(vfs.root.absBase, 'base', 'wurst', 'index.js'), 'abs');
      assert.equal(rv.redirected, '../index.js', 'redirect');
    });

    it('resolve:base-file ../index.js + redirect', () => {
      const rv = Es6isch.resolve(vfs, '../index.js', '/base/wurst/reactPackage/index.js');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved,
        path.join(vfs.root.absBase, 'base', 'wurst', 'index.js'), 'abs');
      assert.equal(rv.redirected, null, 'redirect');
    });

    it('resolve node_module no-redirect', () => {
      const rv = Es6isch.resolve(vfs, 'pkgtest/test.js', '/base/wurst/reactPackage/index.js');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved, path.join(vfs.modules.absBase, 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.redirected, '../../../node_modules_test/pkgtest/test.js', 'redirect');
    });

    it('resolve node_module redirect', () => {
      const rv = Es6isch.resolve(vfs, 'pkgtest', '/base/wurst/reactPackage/index.js');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved, path.join(vfs.modules.absBase, 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.redirected, '../../../node_modules_test/pkgtest/test.js', 'redirect');
    });
  });
  describe('parse', () => {
    it('test import first', () => {
      const parsed = parse(Es6isch.resolve(vfs, './base/wurst/reactPackage/index.js'));
      // console.log(parsed);
      assert.ok(parsed.startsWith('import'));
      assert.ok(parsed.includes(`from '../../../node_modules_test/pkgtest/test.js';`));
    });
    it('test export default last', () => {
      const parsed = parse(Es6isch.resolve(vfs, './base/wurst/localPackage/wurst.js'));
      assert.ok(parsed.endsWith('export default module.exports;'));
    });
  });
  describe('test-server', () => {
    let expressSrv: http.Server;
    let port = ~~((Math.random() * (0x10000 - 1024)) + 1024);
    before(() => {
      expressSrv = server(['_',
        '-p', '' + port,
        '-r', './test/pkgbase/',
        '-m', './test/pkgbase/node_modules_test',
        '-h', './test/pkgbase/html'
      ]);
    });
    it('static-server', (done) => {
      request(`http://localhost:${port}/`, (err, res) => {
        try {
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.include(res.body, '/es6isch/wurst/index.js');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
    it('index-es6isch-redirect', (done) => {
      request(`http://localhost:${port}/es6isch`, (err, res) => {
        try {
          // console.log(res);
          assert.equal(res.request.path, '/es6isch/base/wurst/index.js');
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.startsWith('import * as require__reactPackage from \'./reactPackage/index.js\''));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
    it('index-es6isch-direct', (done) => {
      request(`http://localhost:${port}/es6isch/base/wurst/index.js`, (err, res) => {
        try {
          // console.log(res);
          assert.equal(res.request.path, '/es6isch/base/wurst/index.js');
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.startsWith('import * as require__reactPackage from \'./reactPackage/index.js\''));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
    it('index-es6isch-resolve-module', (done) => {
      request(`http://localhost:${port}/es6isch/base/wurst/reactPackage/index.js`, (err, res) => {
        try {
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.startsWith(
            'import * as require_pkgtest from \'../../../node_modules_test/pkgtest/test.js\''));
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
