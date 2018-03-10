> Rewrite CommonJS to browser-compatible ES2015 imports on the fly

# es6isch

[![Build Status](https://travis-ci.org/mabels/es6isch.svg?branch=master)](https://travis-ci.org/mabels/es6isch)

## Install

```
npm install es6isch
```

## CLI

```
$ es6isch --help
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

## CLI Example

```bash
echo '{"name": "es6isch-example", "version": "1.0.0"}' > package.json
yarn add es6isch react
echo "<body><script type="module">import React from '/node_modules/react'; console.log(React)</script></body>" > index.html
yarn es6isch # open browser on localhost:3000
```


## API Example

```js
const express = require("express");

const app = express();

app.use('/', app(Vfs.from({
  rootAbsBase: './test/projectBase/packages/api',
  es6ischBase: '/'
})));
```

## License
es6isch is released under the Apache License 2.0

