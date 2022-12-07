class ForeverUtil {
    static parseForeverListFromStdout(foreverListResString) {
        let rows = foreverListResString.split("\n");
        const cols = rows[1].split(/\s{1,}/).filter(it => it !== '');
        const datas = [];
        rows = rows.slice(2)
        rows.forEach(row => {
            const items = row.split(/\s{1,}/).filter(it => it !== '');
            if (items.length > 2) {
                const it = {};
                // eslint-disable-next-line array-callback-return
                cols.forEach((key, index) => {
                    it[key] = items[index+1]
                });
                datas.push(it)
            }
        });
        return datas;
    }
    static forever
}

module.exports = ForeverUtil;
