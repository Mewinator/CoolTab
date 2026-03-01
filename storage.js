const Storage = (() => {
    const DB_NAME = 'cooltab-db';
    const STORE_NAME = 'data';
    let dbPromise = null;
    const ROOT_KEY = 'cooltab_root';

    function openDB() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        return dbPromise;
    }

    // low-level helpers that ignore the "root" object entirely
    async function _getRaw(key) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        return new Promise((resolve, reject) => {
            req.onsuccess = async () => {
                const blob = req.result;
                resolve(blob || null);
            };
            req.onerror = () => reject(req.error);
        });
    }

    async function _setRaw(key, blob) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(blob, key);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function _deleteRaw(key) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // utilities for managing the root-json object
    async function readRoot() {
        const blob = await _getRaw(ROOT_KEY);
        if (!blob) return null;
        if (blob.type === 'application/json') {
            try {
                const txt = await blob.text();
                return JSON.parse(txt);
            } catch {
                return null;
            }
        }
        return null;
    }

    async function writeRoot(obj) {
        const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
        await _setRaw(ROOT_KEY, blob);
    }

    function keyToProp(key) {
        if (!key) return key;
        return key.replace(/^cooltab_/, '');
    }

    async function setItem(key, value) {
        // if we already have a root object and value isn't a blob, store
        // it inside the root; otherwise fall back to raw key/value.
        const prop = keyToProp(key);
        const root = await readRoot();
        const isBlob = value instanceof Blob;
        if (root !== null && !isBlob && key !== ROOT_KEY) {
            root[prop] = value;
            await writeRoot(root);
            return;
        }

        // otherwise behave like the old implementation
        let blob;
        if (isBlob) {
            blob = value;
        } else {
            try {
                blob = new Blob([JSON.stringify(value)], { type: 'application/json' });
            } catch (e) {
                blob = new Blob([String(value)], { type: 'text/plain' });
            }
        }
        await _setRaw(key, blob);
    }
    async function getItem(key) {
        const prop = keyToProp(key);
        const root = await readRoot();
        if (root !== null && key !== ROOT_KEY && prop in root) {
            return root[prop];
        }

        // fallback to raw retrieval
        const blob = await _getRaw(key);
        if (!blob) return null;
        if (blob.type === 'application/json') {
            try {
                const txt = await blob.text();
                try {
                    return JSON.parse(txt);
                } catch (err) {
                    return txt;
                }
            } catch (err) {
                console.warn('Failed to read json blob for', key, err);
                return null;
            }
        } else {
            return blob;
        }
    }
    async function migrateLocalStorage() {
        if (!window.localStorage) return;
        const keysToMigrate = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cooltab_')) {
                keysToMigrate.push(key);
            }
        }
        for (const key of keysToMigrate) {
            try {
                const valStr = localStorage.getItem(key);
                let val;
                try {
                    val = JSON.parse(valStr);
                } catch {
                    val = valStr;
                }
                await setItem(key, val);
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('Storage migration failed for', key, e);
            }
        }
    }

    async function migrateToRoot() {
        const existing = await readRoot();
        if (existing !== null) {
            // already migrated or root in use
            return;
        }
        const keys = ['cooltab_apps', 'cooltab_bg_blendpx', 'cooltab_changelog_read_status'];
        const root = {};
        for (const key of keys) {
            const val = await getItem(key);
            if (val !== null) {
                root[keyToProp(key)] = val;
                await _deleteRaw(key);
            }
        }
        if (Object.keys(root).length > 0) {
            await writeRoot(root);
        }
    }

    async function init() {
        await openDB();
        await migrateLocalStorage();
        await migrateToRoot();
    }
    return {
        init,
        get: getItem,
        set: setItem,
        delete: _deleteRaw,
        getRoot: readRoot,
        setRoot: writeRoot,
        update: async (prop, value) => {
            const r = (await readRoot()) || {};
            r[prop] = value;
            await writeRoot(r);
        }
    };
})();
