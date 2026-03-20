const esbuild = require('esbuild');
const config = require('./config');

module.exports = (async () => esbuild.build(await config()).catch(() => process.exit(1)))();
