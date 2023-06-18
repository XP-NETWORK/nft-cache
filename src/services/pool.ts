import { parsedNft } from "../models/interfaces/nft";

interface Item {
    key: string;
    data?: any;
}

class Pool {
    pool: Map<string, any> = new Map();

    get(key: string) {
        return this.pool.get(key);
    }

    /* getItemIndex(key: string) {
        return this.pool.get(key);
    }*/

    checkItem(key: string) {
        return this.pool.has(key);
    }

    addItem(item: Item) {
        this.pool.set(item.key, item.data);
        setTimeout(() => this.releaseItem(item.key), 30000);
    }

    updateItem(key: string, data: parsedNft) {
        this.pool.set(key, data);
    }

    releaseItem(key: string) {
        if (this.pool.size < 1) return;
        this.pool.delete(key);
    }
}

export default () => new Pool();
