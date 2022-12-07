const datap = require('../datap');
class DbUtil {
    static async loadById(collName, id) {
        return datap.mongo.readid(id, collName);
    }

    static async initDbWithData(it) {
        const { coll, indexObj, uniqueOptions = { unique: true }, isCover = false, datas } = it;
        if (coll && indexObj && uniqueOptions) {
            datap.mongo
                .createIndex(coll, indexObj, uniqueOptions)
                .then((res) => console.log('succ ', res))
                .catch((e) => console.error(e));
            let toDbData = [];
            if (isCover) {
                toDbData = datas;
            } else {
                let cols = Object.keys(indexObj);
                for (let i = 0; i < datas.length; i++) {
                    let it = datas[i];
                    let query = {};
                    cols.map((col) => {
                        query[col] = it[col];
                    });
                    let count = await datap.mongo.count(coll, query);
                    if (count === 0) {
                        toDbData.push(it);
                    }
                }
            }
            if (toDbData.length > 0) {
                datap.mongo
                    .bulkWriteUpdateInsert(coll, toDbData, Object.keys(indexObj))
                    .then((res) => {
                        console.log('初始化 ', coll, '成功');
                    })
                    .catch((e) => {
                        console.error(`初始化 ${coll} 失败`, e);
                    });
            }
        }
    }

    static initDb(collDatas) {
        collDatas.map(async (it) => {
            await DbUtil.initDbWithData(it);
        });
    }
}

module.exports = DbUtil;
