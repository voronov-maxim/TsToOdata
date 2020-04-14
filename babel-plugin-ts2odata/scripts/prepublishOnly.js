module.exports = function ts2odataBabelPlugin({ types: t }) {
    return {
        name: 'babel-plugin-prepublishOnly',
        visitor: new (require('./PrepublishOnlyPlugin')).PluginVisitor()
    }
}
