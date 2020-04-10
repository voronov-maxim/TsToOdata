import { Binding, NodePath, Scope } from '@babel/traverse';
import * as bt from '@babel/types';
import * as bhelpers from '../../ts2odata/source/babel/helpers';
import { BabelTraverse } from '../../ts2odata/source/babel/traverse';
import { EntitySetContext } from '../../ts2odata/source/EntitySetContext';
import { SelectExpression } from '../../ts2odata/source/types';

export class QueryCacheVisitor {
    ArrowFunctionExpression = function (path: NodePath, state: any) {
        replaceFunctionNode(path, state);
    }
    CallExpression = function (path: NodePath<bt.CallExpression>, state: any) {
        if (bt.isMemberExpression(path.node.callee) && bt.isIdentifier(path.node.callee.property)) {
            if (path.node.callee.property.name === 'getQueryUrl' || path.node.callee.property.name === 'toArrayAsync') {
                let queryPaser = new QueryParser(getQueries(state), path.scope, state.opts?.odataNamespace);
                queryPaser.parse(path.node);
            }
        }
    }
    FunctionExpression = function (path: NodePath, state: any) {
        replaceFunctionNode(path, state);
    }
    Program = function (path: NodePath<bt.Program>, state: any) {
        let moduleName: string | undefined = state.opts.checkModuleName;
        if (moduleName && !isRequireModule(path.node, moduleName))
            path.stop();
    }
}

class QueryParser {
    private readonly babelTraverse: BabelTraverse;
    private readonly entitySetContext: EntitySetContext;
    private readonly nodes: Array<bt.CallExpression>;
    private readonly queries: Map<bt.Node, string>;
    private readonly scope: Scope;

    constructor(queries: Map<bt.Node, string>, scope: Scope, odataNamespace: string | undefined) {
        this.queries = queries;
        this.scope = scope;
        this.babelTraverse = new BabelTraverse();
        this.entitySetContext = new EntitySetContext('http://dummy', 'dummy', null, '', odataNamespace);
        this.nodes = new Array<bt.CallExpression>()
    }

    private getScope(node: bt.CallExpression): object | undefined {
        if (node.arguments.length > 1) {
            if (bt.isIdentifier(node.arguments[1]))
                return this.getScopeByName(node.arguments[1].name);

            if (bt.isObjectExpression(node.arguments[1]))
                return this.getScopeFromObjectExpression(node.arguments[1]);

            throw new Error('Unknown scope argument type ' + node.arguments[1].type);
        }

        return undefined;
    }
    private getScopeByName(scopeName: string): object {
        let binding: Binding | undefined = this.scope.getBinding(scopeName);
        if (binding && bt.isVariableDeclarator(binding.path.node) && bt.isObjectExpression(binding.path.node.init))
            return this.getScopeFromObjectExpression(binding.path.node.init);

        throw new Error('Variable ' + scopeName + ' not found');
    }
    private getScopeFromObjectExpression(node: bt.ObjectExpression): object {
        let scope: object = {};
        for (let i = 0; i < node.properties.length; i++) {
            let property = node.properties[i];
            if (bt.isObjectProperty(property) && bt.isIdentifier(property.key))
                Object.defineProperty(scope, property.key.name, { get() { return ''; } });
        }
        return scope;
    }
    parse(node: bt.CallExpression): void {
        if (bt.isMemberExpression(node.callee) && bt.isIdentifier(node.callee.property)) {
            this.nodes.push(node);
            if (bt.isCallExpression(node.callee.object))
                this.parse(node.callee.object);
        }
        this.parseNode();
    }
    private parseNode(): void {
        while (this.nodes.length > 0) {
            let node = this.nodes.pop() as bt.CallExpression;
            if (node.arguments.length > 2) {
                this.queries.clear();
                return;
            }

            let callee = node.callee as bt.MemberExpression;
            let property = callee.property as bt.Identifier;
            switch (property.name) {
                case 'expand':
                case 'orderby':
                case 'orderbyDescending':
                case 'thenExpand':
                case 'thenOrderby':
                case 'thenOrderbyDescending':
                    this.traversePropertyPath(node);
                    break;
                case 'filter':
                case 'thenFilter':
                    this.traverseFilter(node);
                    break;
                case 'groupby':
                    this.traverseGroupby(node);
                    break;
                case 'key':
                    this.traverseKey(node);
                    break;
                case 'select':
                case 'thenSelect':
                    this.traverseSelect(node);
                    break;
                case 'asEntitySet':
                case 'getQueryUrl':
                case 'skip':
                case 'thenSkip':
                case 'thenTop':
                case 'toArrayAsync':
                case 'top':
                    break;
                default:
                    this.queries.clear();
                    return;
            }
        }
    }
    private traverseFilter(node: bt.CallExpression): void {
        if (bhelpers.isFunctionExpression(node.arguments[0])) {
            let query: string = this.babelTraverse.traverseAstFilter(this.entitySetContext, node.arguments[0], this.getScope(node));
            this.queries.set(node.arguments[0], query);
        }
    }
    private traverseGroupby(node: bt.CallExpression): void {
        let properties: Array<SelectExpression> = this.traverseSelect(node);
        for (let i = 0; i < properties.length; i++)
            this.entitySetContext.addGroupBy(properties[i]);
    }
    private traverseKey(node: bt.CallExpression): void {
        if (node.arguments.length > 1 && bhelpers.isFunctionExpression(node.arguments[1]))
            this.traversePropertyPathNode(node.arguments[1]);
    }
    private traversePropertyPath(node: bt.CallExpression): void {
        if (bhelpers.isFunctionExpression(node.arguments[0]))
            this.traversePropertyPathNode(node.arguments[0]);
    }
    private traversePropertyPathNode(node: bt.ArrowFunctionExpression | bt.FunctionExpression): void {
        let body: bt.Expression = bhelpers.getFunctionBody(node);
        let expression: string | undefined = this.babelTraverse.traverseAstPropertyPath(body);
        if (expression === undefined)
            throw new Error('Invlid property path');

        this.queries.set(node, expression);
    }
    private traverseSelect(node: bt.CallExpression): Array<SelectExpression> {
        if (bhelpers.isFunctionExpression(node.arguments[0])) {
            let queries: Array<SelectExpression> = this.babelTraverse.traverseAstSelect(this.entitySetContext, node.arguments[0], this.getScope(node));
            let json: string = JSON.stringify(queries);
            this.queries.set(node.arguments[0], json);
            return queries;
        }

        return new SelectExpression[0];
    }
}

function getQueries(state: any): Map<bt.Node, string> {
    if (!state.queries)
        state.queries = new Map<bt.Node, string>();
    return state.queries;
}

function isRequireModule(node: bt.Program, moduleName: string): boolean {
    for (let statement of node.body)
        if (bt.isVariableDeclaration(statement))
            for (let declaration of statement.declarations)
                if (bt.isCallExpression(declaration.init) && bt.isIdentifier(declaration.init.callee) && declaration.init.callee.name === 'require')
                    if (bt.isStringLiteral(declaration.init.arguments[0]) && declaration.init.arguments[0].value === moduleName)
                        return true;

    return false;
}

function replaceFunctionNode(path: NodePath, state: any): void {
    let query: string | undefined = getQueries(state).get(path.node);
    if (query)
        path.replaceWith(bt.stringLiteral(query));
}