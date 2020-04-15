module.exports = function ts2odataBabelPlugin({ types: t }) {
    return {
        name: 'prepublishOnly',
        visitor: new (require('./PrepublishOnlyPlugin')).PluginVisitor()
    }
}
