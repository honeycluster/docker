const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

class Index {
  opts = {
    dir: '.',
    regex: new RegExp(/\.(js|mjs|jsx|ts|tsx)/),
  };
  constructor(opts) {
    if (opts) this.opts = opts;
  }
  files = [];
  getDirectoryFiles = (path) => fs.readdirSync(path);
  isDirectory = async (path) => (await fs.stat(path)).isDirectory();
  make = async (d) => {
    let dir = d ?? this.opts.dir;
    const files = this.getDirectoryFiles(dir);
    for (const file of files) {
      const filepath = path.join(dir, file);

      if (await this.isDirectory(filepath)) await this.make(filepath);

      if (!(await this.isDirectory(filepath)) && file.search(this.opts.regex) > 0)
        this.files.push(filepath);
    }
  };
}

module.exports = async (dir, regex) => {
  let p = new Index({ dir, regex });
  await p.make();
  return p.files;
};
