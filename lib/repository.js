const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

class Repository {
  constructor(directory) {
    this.file = path.join(directory, 'workspace.json');
    fs.mkdirSync(directory, { recursive: true });
    this.data = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : { version: 1, stores: [] };
    if (this.data.version !== 1 || !Array.isArray(this.data.stores)) throw new Error('Unsupported workspace data');
    if (this.data.stores.some(store => store.sync?.state === 'running')) {
      this.update(data => data.stores.forEach(store => {
        if (store.sync?.state === 'running') store.sync = { ...store.sync, state: 'failed', error: '上次同步被中断，请重新同步' };
      }));
    }
  }
  read() { return structuredClone(this.data); }
  update(change) {
    const next = this.read();
    change(next);
    const temporary = this.file + '.' + crypto.randomUUID() + '.tmp';
    try {
      fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
      fs.renameSync(temporary, this.file);
      this.data = next;
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
}
module.exports = { Repository };
