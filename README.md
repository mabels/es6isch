# es6isch

[![Build Status](https://travis-ci.org/mabels/es6isch.svg?branch=master)](https://travis-ci.org/mabels/es6isch)

## Dependencies

* @babel/core
* @babel/trverse
* yargs
* express

## Getting started

It's an server which rewrites a node project (require) to es6 browser import style.

Currently we missing the possiblity to generate a rewritten static filesystem from the 
provided roots.

```
$ node .
Options:
  --help              Show help                                        [boolean]
  --version           Show version number                              [boolean]
  --port, -p          port of the server                         [default: 3000]
  --listen-addr, -l   listen addr                         [default: "localhost"]
  --html-base, -h     path to html base which should es6isch served
                              [default: "$HOME/Software/es6isch"]
  --root-base, -r     path to package base which should es6isch served
                              [default: "$HOME/Software/es6isch"]
  --node-modules, -m  path to node_modules base which should es6isch served
                 [default: "$HOME/oftware/es6isch/node_modules"]
```

default package looks like:

```
$ node dist/src/server.js \
   -r ./test/pkgbase/ 
   -m ./test/pkgbase/node_modules 
```

open http://localhost:3000/ with your browser

# default behavior

if you start es6isch in a node package root it should autoconfigure it self

