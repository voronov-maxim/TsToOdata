module.exports = function ts2odataBabelPlugin({ types: t }) {
    return {
        name: 'babel-plugin-ts2odata',
        visitor: new (require('./plugin')).QueryCacheVisitor()
    }
}
