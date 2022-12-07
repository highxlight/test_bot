const config = require("./config.js");
const {ObjectId, MongoClient} = require("mongodb");
const assert = require("assert");

class MongoConnector {
    #url = "";
    #dbName = "";
    #mongoClient = null;
    #db = null;

    constructor(url, dbName) {
        this.#url = url;
        this.#dbName = dbName;
    }

    async connect(url, dbName) {
        this.#mongoClient = await MongoClient.connect(url ?? this.#url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB");
        this.#db = this.#mongoClient.db(dbName ?? this.#dbName);
    }

    async db(dbName) {
        if (this.#mongoClient == null) {
            await this.connect();
        }
        if (dbName && this.#dbName !== dbName) {
            this.#db = this.#mongoClient.db(dbName);
            this.#dbName = dbName;
        }
        return this.#db;
    }

    async create(coll, doc) {
        const db = await this.db();
        return db.collection(coll).insertOne({
            ...doc,
        });
    }

    async createmany(coll, docs) {
        const db = await this.db();
        let result = await db.collection(coll).insertMany([...docs]);
        if (result?.insertedIds) {
            result.insertedIds = Object.values(result.insertedIds);
        }
        return result;
    }

    async readone(query, coll) {
        const db = await this.db();
        return db.collection(coll).findOne(query, {
            sort: {_id: -1},
        });
    }

    async readid(id, coll) {
        const db = await this.db();
        return db.collection(coll).findOne(
            {
                _id: new ObjectId(id),
            },
            {
                sort: {_id: -1},
            }
        );
    }

    async read(coll, query, limit = 0, skip = 0, sort) {
        const db = await this.db();
        return db
            .collection(coll)
            .find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .toArray();
    }

    async update(coll, doc) {
        const db = await this.db();
        const {id, ...restDoc} = doc;
        return db.collection(coll).updateOne(
            {
                _id: ObjectId(id),
            },
            {
                $set: {...restDoc},
                $currentDate: {
                    lastModified: true,
                },
            }
        );
    }

    async updatemany(coll, q, doc) {
        const db = await this.db();
        return db.collection(coll).updateMany(q, {
            $set: {...doc},
            $currentDate: {
                lastModified: true,
            },
        });
    }

    async upsert(coll, doc) {
        const db = await this.db();
        return db.collection(coll).updateOne(
            {
                [doc["key"]]: doc[doc["key"]],
            },
            {
                $set: {...doc},
                $currentDate: {
                    lastModified: true,
                },
            },
            {
                upsert: true,
            }
        );
    }

    async delete(coll,id ) {
        const db = await this.db();
        return db.collection(coll).deleteMany({
            _id: new ObjectId(id),
        });
    }

    async deletequery(coll, q) {
        const db = await this.db();
        return db.collection(coll).deleteMany(q);
    }

    async count(coll, q) {
        const db = await this.db();
        return db.collection(coll).count(q);
    }

    async createIndex(collectionName, indexObj, uniqueOptions) {
        return this.run(collectionName, (coll) => {
            return coll.createIndex(indexObj, uniqueOptions).then((doc) => {
                console.log("success create ensureIndex", doc)
                return {
                    success: true,
                    data: doc
                }
            })
        })
    }

    bulkWriteUpdateInsert(collectionName, datas, filterCols, options = {ordered: false}) {
        let bulkData = [];
        datas.map(doc => {
            if (filterCols && filterCols.length > 0) {
                let filter = {};
                filterCols.map(colStr => {
                    let col = colStr.trim();
                    if (col !== '') {
                        filter[col] = doc[col];
                    }
                });
                let updateColDoc = doc;
                delete updateColDoc._id;
                let updateBulkObj = {
                    updateOne: {
                        filter: filter,
                        update: {$set: updateColDoc},
                        upsert: true,
                    },
                };
                bulkData.push(updateBulkObj);
            }
        });
        return this.bulkWrite(collectionName, bulkData, options);
    }

    bulkWrite(collectionName, bulkData, callback, options) {
        return this.run(collectionName, (coll) => {
            return coll.bulkWrite(bulkData, options || {});
        });
    }

    /**
     * 执行完毕后自动关闭数据库连接
     * @param collectionName
     * @param callback 需要返回 promise 对象
     * @returns {Promise<unknown>}
     */
    async run(collectionName, callback) {
        let db = null;
        try {
            db = await this.db();
            const coll = db.collection(collectionName);
            return await callback(coll);
        } catch (e) {
            throw new Error(e)
        }
    }
}

module.exports = {
    mongo: new MongoConnector(config.db.mongo),
};
