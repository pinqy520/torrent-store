import * as crypto from 'crypto';
import { Store } from './index';

const DHT = require('bittorrent-dht/server');
const log = require('debug')('main:torrent-test');

const dhtServer = new DHT({ bootstrap: false });

dhtServer.listen(() => {
  log('dhtServer port:', dhtServer.address().port);
  start();
});

async function start() {
  const opts = {
    dht: { bootstrap: '127.0.0.1:' + dhtServer.address().port },
    tracker: false
  };

  const store = new Store(opts);
  const buf: any = crypto.randomBytes(1024);
  const name = crypto.createHash('sha256').update(buf).digest('hex');
  log('name', name)
  const path = await store.save(name, buf);
  log('path', path)

  for(let i = 0; i < 5; i++) {
    await testDownload(i, opts, path)
  }

}

async function testDownload(no: number, opts: any, path: string) {
  const store = new Store(opts);
  const result = await store.get(path);
  log(`download ${no}`, crypto.createHash('sha256').update(result).digest('hex'))
  const reload = await store.get(path);
  log(`reload   ${no}`, crypto.createHash('sha256').update(reload).digest('hex'))
}