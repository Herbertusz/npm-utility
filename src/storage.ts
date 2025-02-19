/**
 * Adattárolás (LocalStorage, SessionStorage, IndexedDB)
 */

type Data<T> = Record<string, T>;

export const JSONparse = function(data: string | null): unknown {
    try {
        return JSON.parse(data as string);
    }
    catch (_error) {
        return { };
    }
};

export const storage = {

    session: {
        get: function(key: string): unknown {
            return JSONparse(sessionStorage.getItem(key));
        },
        set: function(key: string, value: unknown): void {
            sessionStorage.setItem(key, JSON.stringify(value));
        },
    },

    local: {
        get: function(key: string): unknown {
            return JSONparse(localStorage.getItem(key));
        },
        set: function(key: string, value: unknown): void {
            localStorage.setItem(key, JSON.stringify(value));
        },
    }

};

/**
 * Proxy-val megírt storage kezelő (könnyebb módosíthatóság)
 * @param type
 * @param pool
 * @return
 * @example
 *  const form = Cache('session', 'longform');
 *  // read
 *  const name = form.name;
 *  // write
 *  form.name = 'John';
 */
export const Cache = function(
    type: 'local' | 'session', pool: string
): Data<unknown> {
    const target = { };
    if (!storage[type].get(pool)) {
        storage[type].set(pool, { });
    }
    return new Proxy(target, {
        get(_target, prop: string): Data<unknown> {
            const currentPool = storage[type].get(pool);
            return currentPool?.[prop as keyof typeof currentPool] as unknown as Data<unknown>;
        },
        set(_target, prop: string, value: unknown): boolean {
            try {
                storage[type].set(pool, {
                    ...storage[type].get(pool) as Data<unknown>,
                    [prop]: value,
                });
            }
            catch(error) {
                throw new Error(`Cache.set error: ${JSON.stringify(error)}`);
            }
            return true;
        },
        ownKeys(_target): (string | symbol)[] {
            return [...Reflect.ownKeys(storage[type].get(pool) as Data<unknown>)];
        },
        getOwnPropertyDescriptor(_target, prop: string): PropertyDescriptor {
            const currentPool = storage[type].get(pool);
            return {
                value: currentPool?.[prop as keyof typeof currentPool],
                enumerable: true,
                configurable: true,
            };
        }
        // TODO: has, deleteProperty, defineProperty trap megvalósátása
    });
};

/**
 * IndexedDB kezelő objektum
 * @example
 *  // séma létrehozása (a második argumentumot a db séma módosítása esetén léptetni kell):
 *  const db = await DB.createSchema('cube', 1, [
 *      { storeName: 'files', keyPath: 'id' },
 *      { storeName: 'state', keyPath: 'step' }
 *  ]);
 *  // olvasás:
 *  const fileStore = await DB.openStore('cube', 'files');
 *  const storagedPdfs = await DB.get(fileStore, 'pdf');
 *  // beszúrás:
 *  const fileStore = await DB.openStore('cube', 'files');
 *  await DB.put(fileStore, { id: 'png', files: data });
 */
export const DB = {

    createStore: function(storeName: string, keyPath: string = 'id'): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open('nucleus_scouting', 1);

            openRequest.onupgradeneeded = function(): void {
                const db = openRequest.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath });
                }
            };

            openRequest.onsuccess = function(): void {
                const db = openRequest.result;
                resolve(db);
            };

            openRequest.onerror = function(): void {
                console.error('Error', openRequest.error);
                reject({ type: 'storage', message: 'open request error', data: openRequest.error });
            };
        });
    },

    createTransaction: function(db: IDBDatabase, storeName: string): Promise<IDBObjectStore> {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');

            resolve(transaction.objectStore(storeName));

            transaction.onabort = function(): void {
                console.error('Error', transaction.error);
                reject({ type: 'storage', message: 'transaction error', data: transaction.error });
            };
        });
    },

    get: function(store: IDBObjectStore, key: string): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const request = store.get(key);

            request.onsuccess = function(): void {
                resolve(request.result);
            };

            request.onerror = function(): void {
                console.error('Error', request.error);
                reject({ type: 'storage', message: 'get request error', data: request.error });
            };
        });
    },

    add: function(store: IDBObjectStore, data: Data<unknown>): Promise<IDBValidKey> {
        return new Promise((resolve, reject) => {
            const request = store.add(data);

            request.onsuccess = function(): void {
                resolve(request.result);
            };

            request.onerror = function(event): void {
                if (request.error?.name === 'ConstraintError') {
                    // Item with such id already exists
                    event.preventDefault(); // don't abort the transaction
                    event.stopPropagation(); // don't bubble error up, "chew" it
                } else {
                    console.error('Error', request.error);
                    reject({ type: 'storage', message: 'add request error', data: request.error });
                }
            };
        });
    },

    put: function(store: IDBObjectStore, data: Data<unknown>): Promise<IDBValidKey> {
        return new Promise((resolve, reject) => {
            const request = store.put(data);

            request.onsuccess = function(): void {
                resolve(request.result);
            };

            request.onerror = function(): void {
                console.error('Error', request.error);
                reject({ type: 'storage', message: 'put request error', data: request.error });
            };
        });
    },

    delete: function(store: IDBObjectStore, key: string): Promise<IDBValidKey> {
        return new Promise((resolve, reject) => {
            const request = store.delete(key);

            request.onsuccess = function(): void {
                resolve(request.result as unknown as IDBValidKey);
            };

            request.onerror = function(): void {
                console.error('Error', request.error);
                reject({ type: 'storage', message: 'delete request error', data: request.error });
            };
        });
    },

    clear: function(store: IDBObjectStore): Promise<IDBValidKey> {
        return new Promise((resolve, reject) => {
            const request = store.clear();

            request.onsuccess = function(): void {
                resolve(request.result as unknown as IDBValidKey);
            };

            request.onerror = function(): void {
                console.error('Error', request.error);
                reject({ type: 'storage', message: 'clear request error', data: request.error });
            };
        });
    },

};
