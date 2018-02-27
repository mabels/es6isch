import { assert } from 'chai';
import { Es6ischVfs, Es6isch, transform, server, es6app } from '../src/index';
import * as request from 'request';
import * as express from 'express';
import * as path from 'path';
import * as http from 'http';

// const cwd = process.cwd();
describe('es6sich', () => {
  const vfs = Es6ischVfs.from({
      rootAbsBase: path.join(process.cwd(), 'test', 'pkgbase')
    });
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
      // console.log(rv);
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved, path.join(vfs.modules.absBase, 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.redirected, null, 'redirect');
    });

    it('resolve node_module redirect', () => {
      const rv = Es6isch.resolve(vfs, 'pkgtest', '/base/wurst/reactPackage/index.js');
      assert.equal(rv.isError, false, 'error');
      assert.equal(rv.absResolved, path.join(vfs.modules.absBase, 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.redirected, '../../../node_modules/pkgtest/test.js', 'redirect');
    });
  });
  describe('parse', () => {
    it('test import first', () => {
      const parsed = transform(Es6isch.resolve(vfs, './base/wurst/reactPackage/index.js')).parsed;
      // console.log(parsed);
      assert.ok(parsed.startsWith('import'));
      assert.ok(parsed.includes(`from '../../../node_modules/pkgtest/test.js';`));
    });
    it('test export default last', () => {
      const parsed = transform(Es6isch.resolve(vfs, './base/wurst/localPackage/wurst.js')).parsed;
      assert.ok(parsed.endsWith('export default module.exports;'));
    });
  });

  describe('test-server', () => {
    let expressSrv: http.Server;
    let port = ~~((Math.random() * (0x10000 - 1024)) + 1024);
    before(() => {
      const app = express();
      app.use('/wurst', es6app(Es6ischVfs.from({
        rootAbsBase: './test/projectBase/packages/api',
        es6ischBase: '/'
      })));
      expressSrv = app.listen(port, 'localhost', () => { /* */ });
    });

    it('absolute-redirect', (done) => {
      request(`http://localhost:${port}/wurst/`, (err, res) => {
        try {
          // console.log(res.statusCode);
          // console.log(res);
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
          assert.ok(res.body.startsWith(
            'import * as require_react from \'react\';'
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
          assert.ok(res.body.startsWith(
            'import * as require_react from \'react\';'
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
          assert.ok(res.body.startsWith(
            'import * as require_doof from \'doof\';'
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
