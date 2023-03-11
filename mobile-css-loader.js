const { getOptions } = require('loader-utils');
const { validate } = require('schema-utils');
// 参数类型校验
const schema = {
    type: 'object',
    properties: {
        width: {
            type: 'number',
        },
    },
};

module.exports = function loader(source) {
    // webpack 5 已经可以通过this.query 直接获取loader的options配置，所以不需要利用loader-utils工具获取：

    // const options = getOptions(this);
    const options = this.query;
    console.log(options);
    validate(schema, options, {
        name: 'px2vw Loader',
        baseDataPath: 'options',
    });
    const px2vw = px => px / options.width * 100 + 'vw';
    return source.replace(/(\d+)px/g, (_, px) => px2vw(px));
};
