import { createStore, get, set, type UseStore } from "idb-keyval";

export class ImageDB {
    #db: UseStore;

    constructor() {
        this.#db = createStore("article-editor", "images");
    }

    async createKey(file: File) {
        const match = file.name.match(/^(.*)\.([^.]*)$/);
        let [, baseName = "unknown", extension = ""] = match || [];

        baseName = baseName.replaceAll(" ", "-");

        let key = `${baseName}.${extension}`;
        let counter = 1;

        // Check if key exists, if so, increment counter
        while (await get(key, this.#db) !== undefined) {
            key = `${baseName}-(${counter}).${extension}`;
            counter++;
        }

        return key;
    }

    async add(key: string, image: File) {
        await set(key, image, this.#db)
    }

    async get(key: string): Promise<string | undefined> {
        const file: File | undefined = await get(key, this.#db);
        if (!file) return undefined;

        return URL.createObjectURL(file)
    }

    async getBlob(key: string): Promise<Blob | undefined> {
        return await get(key, this.#db);
    }
}
