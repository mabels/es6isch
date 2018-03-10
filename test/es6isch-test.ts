import { assert } from 'chai';
import { Transform } from '../src/transform';
import { server } from '../src/server';
import { NpmResolver } from '../src/npm-resolver';
import { Vfs, Es6isch, NpmIs } from '../src/index';
import * as request from 'request';
import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import { NpmResolverCreateParam } from '../src/npm-resolver';
import { attachNodeLibsInjector } from '../src/node-libs-injector';

// const cwd = process.cwd();
describe('es6sich', () => {
  // const es6isch = new Es6isch(vfs.rootDir);
  const pkgbase = new Es6isch(path.join(process.cwd(), 'test', 'pkgbase'));
  const projectBase = new Es6isch(path.join(process.cwd(), 'test', 'projectBase', 'packages', 'api'));

  const npmResolvCreateParam: NpmResolverCreateParam = attachNodeLibsInjector({
        fsCache: pkgbase.cachator,
        root: pkgbase.rootDir,
        searchPath: [],
        currentRelFname: '',
        inFname: '.',
  });

  describe('NpmFileResolver', () => {
    it('.', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        inFname: '.'
      });
      assert.equal(nfr.inFname, '.', 'inFname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.redirected(), true, 'error');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'resolved');
    });
    it('./doof/./hund/.././../', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        inFname: './doof/./hund/.././../'
      });
      assert.equal(nfr.inFname, './doof/./hund/.././../', 'inFname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.redirected(), true, 'error');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'resolved');
    });

    it('./murks', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        inFname: './murks'
      });
      assert.equal(nfr.inFname, './murks', 'inFname');
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'redirected');
      assert.equal(nfr.error(), false, 'error');
    });
    it('./murks.js', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        inFname: './murks.js'
      });
      assert.equal(nfr.inFname, './murks.js', 'inFname');
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'redirected');
      assert.equal(nfr.error(), false, 'error');
    });
    it('./base/wurst', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        inFname: './base/wurst'
      });
      // console.log(nfr);
      assert.equal(nfr.inFname, './base/wurst', 'fname');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'redirected');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'redirected');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'redirected');
      assert.equal(nfr.error(), false, 'error');
    });
    it('./base/wurst/index.js', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        inFname: './base/wurst/index.js'
      });
      assert.equal(nfr.inFname, './base/wurst/index.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'found');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'resolved');
    });
    it('./base/wurst/index.js:./test.js', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        currentRelFname: './base/wurst/index.js',
        inFname: './test.js'
      });
      assert.equal(nfr.inFname, './test.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'found');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/test.js', 'resolved');
    });
    it('./base/wurst/index.js:.', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        currentRelFname: './base/wurst/index.js',
        inFname: '.'
      });
      assert.equal(nfr.inFname, '.', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'base/wurst/index.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'base/wurst/index.js', 'resolved');
    });
    it('./base/wurst/index.js:./murks', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        currentRelFname: './base/wurst/index.js',
        inFname: './murks.js'
      });
      assert.equal(nfr.inFname, './murks.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'found');
    });

    // api
    it('apilevelpkg', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [
          path.join(projectBase.rootDir, 'node_modules'),
          path.join(projectBase.rootDir, '..', '..', 'node_modules')
        ],
        currentRelFname: './src/test.js',
        inFname: 'apilevelpkg'
      });
      assert.equal(nfr.inFname, 'apilevelpkg', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.resolved().abs, path.join(projectBase.rootDir, 'node_modules/apilevelpkg/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'apilevelpkg/test.js', 'resolved');
    });

    it('projectlevelpkg', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [
          path.join(projectBase.rootDir, 'node_modules'),
          path.join(projectBase.rootDir, '..', '..', 'node_modules')
        ],
        currentRelFname: './src/test.js',
        inFname: 'projectlevelpkg'
      });
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
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [
          path.join(projectBase.rootDir, 'node_modules'),
          path.join(projectBase.rootDir, '..', '..', 'node_modules')
        ],
        currentRelFname: './src/test.js',
        inFname: 'projectlevelpkg/test'
      });
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
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [
          path.join(projectBase.rootDir, 'node_modules'),
          path.join(projectBase.rootDir, '..', '..', 'node_modules')
        ],
        currentRelFname: './src/test.js',
        inFname: 'projectlevelpkg/test.js'
      });
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
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [
          path.join(projectBase.rootDir, 'node_modules'),
          path.join(projectBase.rootDir, '..', '..', 'node_modules')
        ],
        currentRelFname: './src/test.js',
        inFname: 'projectlevelpkg/murks'
      });
      assert.equal(nfr.inFname, 'projectlevelpkg/murks', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'found');
    });

    it('node_modules:projectlevelpkg', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [
          path.join(projectBase.rootDir, 'node_modules'),
          path.join(projectBase.rootDir, '..', '..', 'node_modules')
        ],
        currentRelFname: 'node_modules',
        inFname: 'projectlevelpkg'
      });
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
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [
          path.join(projectBase.rootDir, 'node_modules'),
          path.join(projectBase.rootDir, '..', '..', 'node_modules')
        ],
        currentRelFname: 'node_modules/projectlevelpkg',
        inFname: '.'
      });
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
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [
          path.join(projectBase.rootDir, 'node_modules'),
          path.join(projectBase.rootDir, '..', '..', 'node_modules')
        ],
        currentRelFname: 'node_modules/projectlevelpkg/test.js',
        inFname: '.'
      });
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
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [path.join(pkgbase.rootDir, 'node_modules')],
        currentRelFname: './base/wurst/index.js',
        inFname: 'pkgtest'
      });
      assert.equal(nfr.inFname, 'pkgtest', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'node_modules/pkgtest/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'pkgtest/test.js', 'resolved');
    });
    it('pkgtest/test.js', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [path.join(pkgbase.rootDir, 'node_modules')],
        currentRelFname: './base/wurst/index.js',
        inFname: 'pkgtest/test.js'
      });
      assert.equal(nfr.inFname, 'pkgtest/test.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'found');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'node_modules/pkgtest/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'pkgtest/test.js', 'resolved');
    });
    it('pkgtest/murks.js', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [path.join(pkgbase.rootDir, 'node_modules')],
        currentRelFname: './base/wurst/index.js',
        inFname: 'pkgtest/murks'
      });
      assert.equal(nfr.inFname, 'pkgtest/murks', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), false, 'found');
      assert.equal(nfr.redirected(), false, 'found');
    });

    it('node_modules:pkgtest', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [path.join(pkgbase.rootDir, 'node_modules')],
        currentRelFname: 'node_modules',
        inFname: 'pkgtest'
      });
      assert.equal(nfr.inFname, 'pkgtest', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'found');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'node_modules/pkgtest/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'pkgtest/test.js', 'resolved');
    });

    it('node_modules/pkgtest:.', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [path.join(pkgbase.rootDir, 'node_modules')],
        currentRelFname: 'node_modules/pkgtest',
        inFname: '.'
      });
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
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [path.join(pkgbase.rootDir, 'node_modules')],
        currentRelFname: 'node_modules/pkgtest',
        inFname: './test.js'
      });
      assert.equal(nfr.inFname, './test.js', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), false, 'redirected');
      assert.equal(nfr.resolved().abs, path.join(pkgbase.rootDir, 'node_modules/pkgtest/test.js'), 'absFname');
      assert.equal(nfr.resolved().rel, 'pkgtest/test.js', 'resolved');
    });

    it('stream', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [path.join(pkgbase.rootDir, 'node_modules')],
        currentRelFname: 'pkgtest',
        inFname: 'stream'
      });
      assert.equal(nfr.inFname, 'stream', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'redirected');
      assert.equal(nfr.resolved().abs, require('node-libs-browser').stream);
      assert.equal(nfr.resolved().rel, 'stream-browserify/index.js', 'resolved');
    });

    it('node_modules/stream', () => {
      const nfr = NpmResolver.create({
        ...npmResolvCreateParam,
        searchPath: [path.join(pkgbase.rootDir, 'node_modules')],
        currentRelFname: '',
        inFname: 'node_modules/stream'
      });
      // console.log(nfr);
      assert.equal(nfr.inFname, 'node_modules/stream', 'fname');
      assert.equal(nfr.error(), false, 'error');
      assert.equal(nfr.module(), true);
      assert.equal(nfr.found(), true, 'found');
      assert.equal(nfr.redirected(), true, 'redirected');
      assert.equal(nfr.resolved().abs, require('node-libs-browser').stream);
      assert.equal(nfr.resolved().rel, 'stream-browserify/index.js', 'resolved');
    });

  });

  describe('resolve', () => {
    it('file-resolv directory to ./unknown', () => {
      const rv = pkgbase.resolve('./unknown', 'base');
      assert.equal(rv.inFname, 'base');
      assert.equal(rv.found(), false);
      assert.equal(rv.redirected(), false);
      // assert.equal(rv.resolved(), null, `FFFFF:${rv.resolved()}`);
    });
    it('file-resolv file to ./unknown', () => {
      const rv = pkgbase.resolve('./unknown', 'base/index.html');
      assert.equal(rv.inFname, 'base/index.html');
      assert.equal(rv.found(), false);
      assert.equal(rv.redirected(), false);
      // assert.equal(rv.redirected(), false);
    });
    it('module-resolv directory to unknown', () => {
      const rv = pkgbase.resolve('/base', 'basePkg');
      assert.equal(rv.inFname, 'basePkg');
      assert.equal(rv.found(), false);
      assert.equal(rv.redirected(), false);
    });
    it('module-resolv file to unknown', () => {
      const rv = pkgbase.resolve('/base', 'basePkg/index.html');
      assert.equal(rv.inFname, 'basePkg/index.html');
      assert.equal(rv.found(), false);
      assert.equal(rv.redirected(), false);
    });

    it('resolve package.json:main + redirect', () => {
      const rv = pkgbase.resolve('/', '.');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'index.js'));
      assert.equal(rv.resolved().rel, '/base/wurst/index.js');
    });
    it('resolve index.js + redirect', () => {
      const rv = pkgbase.resolve('./base/wurst/reactPackage', '.');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, 'base/wurst/reactPackage/index.js', 'redirect');
    });
    it('resolve index.js + no redirect', () => {
      const rv = pkgbase.resolve('./base/wurst/reactPackage', './index.js');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), false, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, 'base/wurst/reactPackage/index.js', 'redirect');
    });

    it('resolve:base index.js + redirect', () => {
      const rv = pkgbase.resolve('.', './base/wurst/reactPackage');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, 'base/wurst/reactPackage/index.js', 'redirect');
    });

    it('resolve:base index.js + no redirect', () => {
      const rv = pkgbase.resolve('./index.js', './base/wurst/reactPackage');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), false, 'redirect');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, 'base/wurst/reactPackage/index.js', 'redirect');
    });

    it('resolve:base-file index.js + redirect', () => {
      const rv = pkgbase.resolve('.', './base/wurst/reactPackage');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs,
        path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, 'base/wurst/reactPackage/index.js', 'redirect');
    });

    it('resolve:base-file index.js + no redirect', () => {
      const rv = pkgbase.resolve('./index.js', './base/wurst/reactPackage/index.js');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), false, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'reactPackage', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, 'base/wurst/reactPackage/index.js', 'redirect');
    });

    it('resolve:base-file .. + redirect', () => {
      const rv = pkgbase.resolve('./base/wurst/reactPackage/index.js', '..');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, 'base/wurst/index.js', 'redirect');
    });

    it('resolve:base-file ../index.js + noredirect', () => {
      const rv = pkgbase.resolve('./base/wurst/reactPackage/index.js', '../index.js');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), false, 'redirect');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'base', 'wurst', 'index.js'), 'abs');
      assert.equal(rv.resolved().rel, 'base/wurst/index.js', 'redirect');
    });

    it('resolve node_module pktest/test.js not found', () => {
      const rv = pkgbase.resolve('pkgtest/test.js', './murks.js');
      // console.log(rv);
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), false, 'found');
      assert.equal(rv.redirected(), false, 'redirect');
      // assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      // assert.equal(rv.resolved().rel, null, 'redirect');
    });

    it('resolve node_module pktest/test.js found ./test.js', () => {
      const rv = pkgbase.resolve('pkgtest/test.js', './test.js');
      // console.log(rv);
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), false, 'redirect');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, 'pkgtest/test.js', 'redirect');
    });

    it('resolve node_module abs redirect', () => {
      const rv = pkgbase.resolve('/', 'pkgtest');
      // console.log(rv);
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'redirect');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, 'pkgtest/test.js', 'redirect');
    });

    it('resolve node_module rel . redirect', () => {
      const rv = pkgbase.resolve('/node_modules/pkgtest', '.');
      // console.log(rv);
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.module(), true, 'module');
      assert.equal(rv.redirected(), true, 'redirect');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, 'pkgtest/test.js', 'redirect');
    });

    it('resolve node_module no-redirect', () => {
      const rv = pkgbase.resolve('/node_modules/pkgtest', './test.js');
      // console.log(rv);
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), false, 'redirect');
      assert.equal(rv.is, NpmIs.MODULE, 'is');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, 'pkgtest/test.js', 'redirect');
    });

    it('resolve node_module redirect', () => {
      const rv = pkgbase.resolve('/base/wurst/reactPackage/index.js', 'pkgtest');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'found');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, 'pkgtest/test.js', 'redirect');
    });

    it('resolve plain module redirect -> test.js', () => {
      const rv = pkgbase.resolve('pkgtest', '');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'redirected');
      assert.equal(rv.module(), true, 'module');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, 'pkgtest/test.js', 'redirect');
    });

    it('resolve plain module redirect -> test -> test.js', () => {
      const rv = pkgbase.resolve('pkgtest', './test');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), true, 'redirected');
      assert.equal(rv.module(), true, 'module');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, 'pkgtest/test.js', 'redirect');
    });

    it('resolve plain module direct.js', () => {
      const rv = pkgbase.resolve('pkgtest', './test.js');
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.redirected(), false, 'redirected');
      assert.equal(rv.module(), true, 'module');
      assert.equal(rv.resolved().abs, path.join(pkgbase.rootDir, 'node_modules', 'pkgtest', 'test.js'), 'abs');
      assert.equal(rv.resolved().rel, 'pkgtest/test.js', 'redirect');
    });

    it('resolve stream redirect', () => {
      const rv = pkgbase.resolve('/test.js', 'stream');
      // console.log(rv);
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.module(), true, 'module');
      assert.equal(rv.redirected(), true, 'redirect');
      assert.equal(rv.resolved().abs, require('node-libs-browser').stream, 'abs');
      assert.equal(rv.resolved().rel, 'stream-browserify/index.js', 'redirect');
    });

    it('resolve /node_modules/stream redirect', () => {
      const rv = pkgbase.resolve('/node_modules/stream', '.');
      // console.log(rv);
      assert.equal(rv.error(), false, 'error');
      assert.equal(rv.found(), true, 'found');
      assert.equal(rv.module(), true, 'module');
      assert.equal(rv.redirected(), true, 'redirect');
      assert.equal(rv.resolved().abs, require('node-libs-browser').stream, 'abs');
      assert.equal(rv.resolved().rel, 'stream-browserify/index.js', 'redirect');
    });

  });
  describe('parse', () => {
    it('test import module', () => {
      const transformed = Transform.run(pkgbase.cachator,
        pkgbase.resolve('/', './base/wurst/reactPackage/index.js'));
      const parsed = transformed.transformed;
      assert.ok(transformed.resolved.filter(i => !i.found()).length == 0, '1:' + parsed);
      assert.ok(parsed.startsWith('import'), '2:' + parsed);
      assert.ok(parsed.includes(`from '/node_modules/pkgtest/test.js';`), '3:' + parsed);
      assert.ok(parsed.includes(`from '/node_modules/domain-browser/source/index.js';`), '4:' + parsed);
    });
    it('test import relative', () => {
      const transformed = Transform.run(pkgbase.cachator, pkgbase.resolve('/', './base/wurst/index.js'));
      const parsed = transformed.transformed;
      assert.ok(transformed.resolved.filter(i => !i.found()).length > 0, 'errors');
      assert.ok(parsed.startsWith('import'), 'import');
      assert.ok(parsed.includes(`from '/base/wurst/reactPackage/index.js';`), 'reactPackage/index.js');
      assert.ok(parsed.includes(`not found:MODULE:[react]`), 'error: react');
      assert.ok(parsed.includes(`not found:FILE:[./localPackage]`), `localPackage:${parsed}`);
      assert.ok(parsed.includes(`from '/base/wurst/localPackage/wurst.js'`), parsed);
    });

    it('test export default last', () => {
      const transformed = Transform.run(pkgbase.cachator,
        pkgbase.resolve('/', './base/wurst/localPackage/wurst.js'));
      const parsed = transformed.transformed;
      assert.ok(transformed.resolved.filter(i => !i.found()).length == 0, 'errors');
      assert.ok(parsed.endsWith('export default module.exports;'));
    });

  });

  describe('/wurst test-server', () => {
    let expressSrv: http.Server;
    let port = ~~((Math.random() * (0x10000 - 1024)) + 1024);
    before(() => {
      const eapp = express();
      eapp.use('/wurst', Es6isch.app(Vfs.from({
        rootAbsBase: './test/projectBase/packages/api',
        es6ischBase: '/wurst'
      })));
      expressSrv = eapp.listen(port, 'localhost', () => { /* */ });
    });

    it('test path of require(".") ', (done) => {
      request({
          followRedirect: false,
          followAllRedirects: false,
          url: `http://localhost:${port}/wurst/src/test.js`
        }, (err, res) => {
        try {
          // console.log(res.statusCode);
          // console.log(res.headers.location);
          assert.ok(res.statusCode == 200);
          assert.ok(res.body.includes('require__ from \'/wurst/src/index.js\''), res.body);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('index-html', (done) => {
      request(`http://localhost:${port}/wurst/src/index.html`, (err, res) => {
        try {
          // console.log(res.statusCode);
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300, `statusCode:${res.statusCode}`);
          assert.ok(res.body.includes('We Speak ES6isch'), res.body);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('murks-html', (done) => {
      request(`http://localhost:${port}/wurst/src/murks.html`, (err, res) => {
        try {
          // console.log(res.statusCode);
          // console.log(res.body);
          assert.ok(404 == res.statusCode, `statusCode:${res.statusCode}`);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('redirect ', (done) => {
      request({
          followRedirect: false,
          followAllRedirects: false,
          url: `http://localhost:${port}/wurst/`
        }, (err, res) => {
        try {
          // console.log(res.statusCode);
          // console.log(res.headers.location);
          assert.ok(res.statusCode == 302);
          assert.ok(res.headers.location, '/wurst/src/test.js');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('absolute-redirect', (done) => {
      request(`http://localhost:${port}/wurst/`, (err, res) => {
        try {
          // console.log(res.statusCode);
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300);
          assert.ok(res.body.startsWith(
            'import * as require_apilevelpkg from \'/wurst/node_modules/apilevelpkg/test.js\''), res.body);
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
            'import * as require_apilevelpkg from \'/node_modules/apilevelpkg/test.js\''));
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
            'import * as require_apilevelpkg from \'/node_modules/apilevelpkg/test.js\''));
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
            'import * as require_projectlevelpkg from \'/node_modules/projectlevelpkg/test.js\';'
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
            'import * as require_projectlevelpkg from \'/node_modules/projectlevelpkg/test.js\';'
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
          // console.log(res.statusCode);
          // console.log(res.body);
          assert.ok(200 <= res.statusCode && res.statusCode < 300, '' + res.statusCode);
          assert.ok(res.body.includes(
            '// es6isch-project-level-pkg'
          ), res.body);
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
          assert.ok(200 <= res.statusCode && res.statusCode < 300, '' + res.statusCode);
          assert.ok(res.body.includes(
            '// es6isch-project-level-pkg'
          ), res.body);
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
