const WebTorrent = require('webtorrent');
import { Instance, Options, Torrent, TorrentFile } from 'webtorrent';

export enum ProtocolType {
  BitTorrent = 'bt'
}

export class Store {
  public readonly client: Instance;

  constructor(opt?: Options) {
    this.client = new WebTorrent(opt);
  }

  public async save(
    name: string,
    buffer: Buffer,
    protocol = ProtocolType.BitTorrent
  ) {
    if (protocol === ProtocolType.BitTorrent) {
      name = name.slice(0, 16)
      const buf = Object.assign(Buffer.from(buffer), { name });
      const torrent = await this._seed(buf);
      return `/${protocol}/${torrent.infoHash}/${name}`;
    }
    return '';
  }

  public async get(path: string) {
    const [, protocol, dir, name] = path.split('/');
    switch (protocol) {
      case ProtocolType.BitTorrent:
        const torrent = await this._get(dir);
        const file = torrent.files.find(f => f.name === name);
        if (file) {
          return this._getFileBuffer(file);
        }
    }
    return null;
  }

  private async _getFileBuffer(file: TorrentFile) {
    return new Promise<Buffer>((resolve, reject) => {
      file.getBuffer((err, buf) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(buf);
        }
      });
    });
  }

  private _seed(buf: any) {
    return new Promise<Torrent>(resolve => {
      this.client.seed(buf,  resolve);
    });
  }

  private _get(infoHash: string) {
    return new Promise<Torrent>(resolve => {
      const t = this.client.get(infoHash);
      if (t) {
        resolve(t);
      }
      else {
        this.client.add(infoHash,   resolve);
      }
    });
  }
}
