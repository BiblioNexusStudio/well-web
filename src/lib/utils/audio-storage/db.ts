import type { Chunk, Metadata } from './audio-store';

type EvTarget = { result: IDBDatabase } | null;

export default class DB {
    name: string;
    version: number;
    db: IDBDatabase | undefined;

    constructor() {
        this.name = 'AudioStore';
        this.version = 1;
    }

    init(): Promise<DB> {
        return new Promise((resolve, reject) => {
            const req = window.indexedDB.open(this.name, this.version);

            let exists = true;

            req.onsuccess = (ev) => {
                if (exists) {
                    const log = `database ${this.name} v${this.version} exists`;
                    console.info(log);
                    this.db = (ev.target as EvTarget)?.result;
                    resolve(this);
                }
            };

            req.onupgradeneeded = (ev) => {
                this.db = (ev.target as EvTarget)?.result;

                if (this.db?.version === this.version) {
                    exists = false;
                    void this.createStores(this.db).then(() => {
                        const log = `database ${this.name} v${this.version} created`;
                        console.info(log);
                        resolve(this);
                    });
                }
            };

            req.onerror = reject;
        });
    }

    createStores(db: IDBDatabase): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const chunks = db.createObjectStore('chunks', { keyPath: 'id' });
            const meta = db.createObjectStore('metadata', { keyPath: 'name' });

            chunks.createIndex('id', 'id', { unique: true });
            meta.createIndex('name', 'name', { unique: true });

            // these share a common transaction, so no need to bind both
            chunks.transaction.oncomplete = () => resolve(db);
            chunks.transaction.onerror = reject;
        });
    }

    getRecord(storeName: string, id: string): Promise<Chunk | Metadata> {
        return new Promise((resolve, reject) => {
            const transaction = this.db?.transaction(storeName, 'readwrite');
            const store = transaction?.objectStore(storeName);
            const request = store?.get(id);

            if (request) {
                request.onsuccess = () => resolve(request.result);
                request.onerror = reject;
            }
        });
    }

    saveRecords(storeName: string, records: Chunk[] | Metadata[]) {
        return new Promise((resolve, reject) => {
            const transaction = this.db?.transaction(storeName, 'readwrite');
            const store = transaction?.objectStore(storeName);

            records.forEach((record) => store?.put(record));

            if (transaction) {
                transaction.oncomplete = () => resolve(true);
                transaction.onerror = reject;
            }
        });
    }
}
