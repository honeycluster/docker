const esbuild = require('esbuild');
const config = require('./config');

module.exports = (async () => {
  const ctx = await esbuild.context(await config());
  await ctx.watch();
})();
