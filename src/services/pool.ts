import { parsedNft } from "../models/interfaces/nft";

interface Item {
  key: string;
  data?: any;
}

class Pool {
  pool: Item[] = [];

  get(idx: number) {
    return this.pool[idx];
  }

  getItemIndex(key: string) {
    return this.pool.findIndex((item) => item.key === key);
  }

  checkItem(key: string) {
    return this.getItemIndex(key) > -1;
  }

  addItem(item: Item) {
    this.pool.push(item);
    setTimeout(() => this.releaseItem(item.key), 30000);
  }

  updateItem(key: string, data: parsedNft) {
    const idx = this.getItemIndex(key);

    if (idx > -1) {
      this.pool[idx] = {
        ...this.pool[idx],
        data,
      };
    }
  }

  releaseItem(key: string) {
    if (this.pool.length < 1) return;
    const idx = this.getItemIndex(key);

    if (idx > -1) {
      this.pool.splice(idx, 1);
    }
  }
}

export default () => new Pool();
