const bpt = require('babel-plugin-tester');
const plugin = require('../source/index');
const path = require('path');

bpt.default({
    plugin,
    fixtures: path.join(__dirname, 'fixtures'),
    endOfLine: 'crlf',
    formatResult: bpt.formatResultWithPrettier,
    babelOptions: {
        parserOpts: {},
        generatorOpts: { retainLines: true, retainFunctionParens: true },
        babelrc: true,
        configFile: false,
    },
    pluginOptions: {
        odataNamespace: "OdataToEntity.Test.Model"
    }
})