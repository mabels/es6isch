import * as express from 'express';
import Es6App from './es6app';
import { findPathOfPackageJson } from './es6isch';

const app = express();

const packageBase = findPathOfPackageJson(process.cwd());
app.use(Es6App(packageBase));

app.listen(3000, () => console.log(`We speak es6isch on 3000 mounted on: ${packageBase}`));