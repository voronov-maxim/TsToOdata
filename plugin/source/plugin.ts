import { Binding, NodePath, Scope } from '@babel/traverse';
import * as bt from '@babel/types';
import * as bhelpers from '../../project/source/babel/helpers';
import { BabelTraverse } from '../../project/source/babel/traverse';
import { EntitySetContext } from '../../project/source/EntitySetContext';
import { getQueryCache } from '../../project/source/QueryCache';
import { SelectExpression } from '../../project/source/types';

export default function () {
    return {
        name: 'ts2odata-babel-plugin',
        visitor: new QueryCacheVisitor()
    };
}

export class QueryCacheVisitor {
    ArrowFunctionExpression = function (path: NodePath) {
        replaceFunctionNode(path);
        if (path.node.start && path.node.start < 0)
            path.replaceWith(bt.stringLiteral(path.node.start.toString()));
    }
    CallExpression = function (path: NodePath) {
        let node = path.node as bt.CallExpression;

        if (bt.isMemberExpression(node.callee) && bt.isIdentifier(node.callee.property)) {
            if (node.callee.property.name === 'getQueryUrl' || node.callee.property.name === 'toArrayAsync') {
                let queryPaser = new QueryParser(path.scope, path.state?.opts?.extra?.odataNamespace);
                queryPaser.parse(node);
            }
        }
    }
    FunctionExpression = function (path: NodePath) {
        replaceFunctionNode(path);
    }
}

function replaceFunctionNode(path: NodePath): void {
    if (path.node.start && path.node.start < 0)
        path.replaceWith(bt.stringLiteral((-path.node.start).toString()));
}

class QueryParser {
    private readonly babelTraverse: BabelTraverse;
    private readonly entitySetContext: EntitySetContext;
    private readonly nodes: Array<bt.CallExpression>;
    private readonly scope: Scope;

    constructor(scope: Scope, odataNamespace: string | undefined) {
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
                    return;
                default:
                    throw new Error('Unknown method ' + property.name);
            }
        }
    }
    private traverseFilter(node: bt.CallExpression): void {
        if (bhelpers.isFunctionExpression(node.arguments[0])) {
            let expression: string = this.babelTraverse.traverseAstFilter(this.entitySetContext, node.arguments[0], this.getScope(node));
            let index = getNextIndex();
            getQueryCache().addFilterExpression(index.toString(), expression);
            node.arguments[0].start = -index;
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

        let index = getNextIndex();
        getQueryCache().addPropertyPath(index.toString(), expression);
        node.start = -index;
    }
    private traverseSelect(node: bt.CallExpression): Array<SelectExpression> {
        if (bhelpers.isFunctionExpression(node.arguments[0])) {
            let expression: Array<SelectExpression> = this.babelTraverse.traverseAstSelect(this.entitySetContext, node.arguments[0], this.getScope(node));
            let index = getNextIndex();
            getQueryCache().addSelectExpression(index.toString(), expression);
            node.arguments[0].start = -index;
            return expression;
        }

        return new SelectExpression[0];
    }
}

let index: number;

function getNextIndex(): number {
    if (index)
        index++;
    else
        index = 1;
    return index;
}