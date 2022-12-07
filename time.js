module.exports = () => {
  const records = {};

  const time = (label) => {
    if (records[label] == null) {
      records[label] = {};
    }
    if (records[label].start != null) {
      if (records[label].end != null) {
        delete records[label];
        time(label);
      } else {
        records[label].end = Date.now();
        records[label].consumed = records[label].end - records[label].start;
      }
    } else {
      records[label].start = Date.now();
    }
  };

  const timeStart = (label) => {
    records[label] = {
      start: Date.now(),
    };
  };

  const timeEnd = (label) => {
    if (records[label]?.start) {
      records[label].end = Date.now();
      records[label].consumed = records[label].end - records[label].start;
    }
  };

  const getResult = () => {
    const result = {};
    for (const label in records) {
      if (records[label]?.consumed != null) {
        result[label] = records[label];
      }
    }

    return result;
  };

  const getResultText = () => {
    const result = getResult();

    let totalConsumed = 0;
    const resultTextAry = [];

    for (const label in result) {
      totalConsumed = totalConsumed + result[label].consumed;
      resultTextAry.push(`${label} +${result[label].consumed}ms`);
    }

    resultTextAry.unshift(`total: +${totalConsumed}ms`);

    return resultTextAry.join("\n");
  };

  return {
    time,
    timeStart,
    timeEnd,
    getResult,
    getResultText,
  };
};
