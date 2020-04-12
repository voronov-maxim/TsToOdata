import { default as traverse, NodePath } from '@babel/traverse';
import * as bt from '@babel/types';
import { EntitySetContext } from '../EntitySetContext';
import * as helpers from '../helpers';
import { EntityDefinition, PropertyDefinition } from '../OdataParser';
import { SelectExpression, SelectKind } from '../types';
import * as bhelpers from './helpers';

type NodePathBase = Omit<NodePath, "unshiftContainer" | "setContext">;

export class FilterVisitor {
    BinaryExpression = function (path: NodePath<bt.BinaryExpression>, state: any) {
        VisitBinaryExpression(path, state);
    }
    BooleanLiteral = function (path: NodePath<bt.BooleanLiteral>, state: any) {
        if (state.expression !== '')
            state.expression += ',';
        state.expression += path.node.value.toString();
    }
    CallExpression = function (path: NodePath<bt.CallExpression>, state: any) {
        VisitCallExpression(path, state);
    }
    Identifier = function (path: NodePath<bt.Identifier>, state: any) {
        if (path.listKey === 'params' && bhelpers.isFunctionExpression(path.parent))
            state.paramName = path.node.name;
        else
            state.expression = getVariableTextNode(path.node, state.entitySetContext.odataNamespace, state.scope);
    }
    LogicalExpression = function (path: NodePath<bt.LogicalExpression>, state: any) {
        VisitBinaryExpression(path, state);
    }
    MemberExpression = function (path: NodePath<bt.MemberExpression>, state: any) {
        let expression: string;
        if (isEntityProperty(path.node, state.paramName))
            expression = getExpressionPropertyPath(path.node, state);
        else
            expression = getVariableTextNode(path.node, state.entitySetContext.odataNamespace, state.scope);

        if (state.expression === '')
            state.expression = expression;
        else
            state.expression += ',' + expression;
        path.skip();
    }
    NewExpression = function (path: NodePath<bt.NewExpression>, state: any) {
        if (bt.isIdentifier(path.node.callee) && path.node.callee.name == 'Date')
            if (bt.isStringLiteral(path.node.arguments[0])) {
                state.expression = new Date(path.node.arguments[0].value).toISOString();
                path.skip();
                return;
            }

        throw new Error('Not supported');
    }
    NullLiteral = function (path: NodePath<bt.NullLiteral>, state: any) {
        if (state.expression !== '')
            state.expression += ',';
        state.expression += 'null';
    }
    NumericLiteral = function (path: NodePath<bt.NumberLiteral>, state: any) {
        if (state.expression !== '')
            if (!bt.isUnaryExpression(path.parent))
                state.expression += ',';
        state.expression += path.node.value.toString();
    }
    StringLiteral = function (path: NodePath<bt.StringLiteral>, state: any) {
        if (state.expression !== '')
            state.expression += ',';
        state.expression += '\'' + path.node.value + '\'';
    }
    UnaryExpression = function (path: NodePath<bt.UnaryExpression>, state: any) {
        state.expression = path.node.operator;
    }
}

export class SelectVisitor {
    Identifier = function (path: NodePath<bt.Identifier>, state: any) {
        if (path.listKey === 'params' && bhelpers.isFunctionExpression(path.parent))
            state.paramName = path.node.name;
    }
    Property = function (path: NodePath<bt.ObjectProperty>, state: any) {
        let entitySetContext = state.entitySetContext as EntitySetContext;
        let expression: string;
        let isCompute = !bt.isMemberExpression(path.node.value);
        let kind: SelectKind;
        if (isCompute) {
            let nestedState = {
                visitor: state.filterVisitor,
                scope: state.scope,
                expression: '',
                paramName: state.paramName,
                entitySetContext,
                kind: entitySetContext.isGroupby() ? SelectKind.Aggregate : SelectKind.Compute
            };
            (traverse as any).node(path.node, nestedState.visitor, path.scope, nestedState, path, { key: true });
            expression = nestedState.expression;
            kind = nestedState.kind;
        }
        else {
            if (bt.isMemberExpression(path.node.value))
                expression = bhelpers.getNodePropertyPath(path.node.value);
            else
                throw Error('Property value must be member expression');

            if (state.entitySetContext.isGroupby() && expression.startsWith('key/')) {
                let alias: string = expression.substring('key/'.length);
                expression = state.entitySetContext.getSelectExpressionByAlias(alias).expression;
            }
            kind = SelectKind.Select;
        }

        let properties = state.properties as Array<SelectExpression>;
        properties.push(new SelectExpression(expression, path.node.key.name, kind));
        path.skip();
    }
}

function binaryOperatorToOdata(operatorKind: string): string {
    switch (operatorKind) {
        case '==':
        case '===':
            return 'eq';
        case '!=':
        case '!==':
            return 'ne';
        case '>':
            return 'gt';
        case '>=':
            return 'ge';
        case '<':
            return 'lt';
        case '<=':
            return 'le';
        case '&&':
            return 'and';
        case '||':
            return 'or';
        case '+':
            return 'add';
        case '-':
            return 'sub';
        case '*':
            return 'mul';
        case '/':
            return 'div';
        case '%':
            return 'mod';
        default:
            throw Error('Unsupported operator ' + operatorKind);
    }
}

function fixEnum(path: NodePathBase, state: any): [bt.Node, string] | undefined {
    let entitySetContext: EntitySetContext = state.entitySetContext;
    if (!helpers.isFixEnum(entitySetContext))
        return undefined;

    let paramName: string = state.paramName;
    let binaryNode = path.node as bt.BinaryExpression;
    let propertyNode: bt.MemberExpression;
    let valueNode: bt.Node;
    if (isEntityProperty(binaryNode.left, paramName)) {
        if (isEntityProperty(binaryNode.right, paramName))
            return undefined;
        propertyNode = binaryNode.left;
        valueNode = binaryNode.right;
    }
    else if (isEntityProperty(binaryNode.right, paramName)) {
        if (isEntityProperty(binaryNode.left, paramName))
            return undefined;
        propertyNode = binaryNode.right;
        valueNode = binaryNode.left;
    }
    else
        return undefined;

    let entityDef: EntityDefinition = getEntityDefinition(entitySetContext, propertyNode);
    let propertyDef: PropertyDefinition | undefined = entityDef.properties.get(propertyNode.property.name);
    if (!propertyDef || !propertyDef.isEnum)
        return undefined;

    let enumValue: string | null = '';
    if (bt.isIdentifier(valueNode) || bt.isMemberExpression(valueNode)) {
        enumValue = bt.isMemberExpression(valueNode) ? valueNode.property.name : valueNode.name;
        if (state.scope !== undefined && state.scope[enumValue as string] !== undefined)
            return [propertyNode, '@' + entitySetContext.odataNamespace + '.' + propertyDef.propertyType + '\'' + '@{' + enumValue + '}\''];
    }
    else if (bt.isStringLiteral(valueNode))
        enumValue = valueNode.value;
    else if (bt.isNullLiteral(valueNode))
        enumValue = null;
    else
        return undefined;

    if (enumValue === null)
        return [propertyNode, 'null'];

    if (helpers.isEnumTextValue(enumValue, entitySetContext.odataNamespace))
        return [propertyNode, enumValue];

    enumValue = entitySetContext.odataNamespace + '.' + propertyDef.propertyType + '\'' + enumValue + '\'';
    return [propertyNode, enumValue];
}

function getEntityDefinition(entitySetContext: EntitySetContext, navigationPath?: bt.MemberExpression): EntityDefinition {
    let entityDef: EntityDefinition = entitySetContext.getEntityDefinition();
    if (navigationPath) {
        let navigationProperties = new Array<string>();
        let node: bt.MemberExpression = navigationPath;
        while (bt.isMemberExpression(node.object)) {
            node = node.object;
            navigationProperties.push(node.property.name);
        }

        while (navigationProperties.length > 0) {
            let propertyDef: PropertyDefinition = entityDef.properties.get(navigationProperties.pop() as string) as PropertyDefinition;
            entityDef = propertyDef.propertyType as EntityDefinition;
        }
    }
    return entityDef;
}

function getExpressionPropertyPath(node: bt.MemberExpression, state: any): string {
    let propertyPath = bhelpers.getNodePropertyPath(node);
    let entitySetContext = state.entitySetContext as EntitySetContext;
    if (entitySetContext.isGroupby()) {
        let alias: string = propertyPath;
        if (propertyPath.startsWith('key/'))
            alias = alias.substring('key/'.length);

        let selectExpression: SelectExpression | null = entitySetContext.getSelectExpressionByAlias(alias);
        if (selectExpression !== null && selectExpression.kind === SelectKind.Select)
            propertyPath = selectExpression.expression;
    }
    return propertyPath;
}

function getVariableTextNode(node: bt.Node, odataNamespace: string, scope?: any): string {
    if (scope)
        if (bt.isIdentifier(node) || bt.isMemberExpression(node)) {
            let parameterName: string = bt.isMemberExpression(node) ? node.property.name : node.name;
            let value: any = scope[parameterName];
            if (value !== undefined)
                return '{' + parameterName + '}';

            if (bt.isIdentifier(node))
                throw Error(node.name + ' not found in scope');
        }

    if (bt.isStringLiteral(node)) {
        if (helpers.isEnumTextValue(node.value, odataNamespace))
            return node.value;
        return '\'' + node.value + '\''
    }

    if (bt.isNumericLiteral(node))
        return node.value.toString();

    if (bt.isNullLiteral(node))
        return 'null';

    if (bt.isMemberExpression(node)) {
        let expression: string = '';
        if (odataNamespace) {
            if (bt.isMemberExpression(node.object)) {
                if (bt.isIdentifier(node.object.property))
                    expression = odataNamespace + '.' + node.object.property.name;
                else if (bt.isStringLiteral(node.object.property))
                    expression = odataNamespace + '.' + node.object.property.value;
                else
                    throw Error('Unknown enum property type ' + node.object.property.type);
            }
            else if (bt.isIdentifier(node.object))
                expression = odataNamespace + '.' + node.object.name;
            else
                throw new Error("Unknown text value " + node.type)
        }
        return expression + '\'' + node.property.name + '\'';
    }

    throw Error('getVariableTextNode invalid node type ' + node.type);
}

function isEntityProperty(node: bt.Node, paramName: string): node is bt.MemberExpression {
    if (bt.isMemberExpression(node)) {
        do {
            node = node.object;
        }
        while (bt.isMemberExpression(node));
        return bt.isIdentifier(node) && node.name === paramName;
    }

    return false;
}

function isParenthesized(node: bt.Node) {
    return (node as any).extra?.parenthesized === true;
}

function parseNestedFunction(path: NodePath<bt.CallExpression>, state: any): string {
    if (!(bhelpers.isFunctionExpression(path.node.arguments[0]) && bt.isIdentifier(path.node.arguments[0].params[0])))
        throw Error('Argument must be function');

    let nestedState = {
        visitor: state.visitor,
        entitySetContext: state.entitySetContext,
        scope: state.scope,
        expression: '',
        paramName: path.node.arguments[0].params[0].name
    };
    if (bt.isArrowFunctionExpression(path.node.arguments[0]))
        (traverse as any).node(path.node.arguments[0], nestedState.visitor, path.scope, nestedState, path, { params: true });
    else
        (traverse as any).node(path.node.arguments[0].body, nestedState.visitor, path.scope, nestedState, path);
    return nestedState.expression;
}

function traverseNode(path: NodePathBase, node: bt.Node, skipKey: string, state: any): string {
    let nestedState = {
        visitor: state.visitor,
        scope: state.scope,
        expression: '',
        paramName: state.paramName,
        entitySetContext: state.entitySetContext
    };
    let skipKeys: any = {};
    skipKeys[skipKey] = true;
    (traverse as any).node(node, state.visitor, path.scope, nestedState, path, skipKeys);
    return nestedState.expression;
}

function VisitBinaryExpression(path: NodePath<bt.BinaryExpression> | NodePath<bt.LogicalExpression>, state: any): void {
    let leftExpression: string;
    let rightExpression: string;
    let result: [bt.Node, string] | undefined = fixEnum(path, state);
    if (result) {
        if (path.node.left === result[0]) {
            leftExpression = traverseNode(path, path.node, 'right', state);
            rightExpression = result[1];
            if (isParenthesized(path.node.left))
                leftExpression = '(' + leftExpression + ')';
        }
        else {
            leftExpression = result[1];
            rightExpression = traverseNode(path, path.node, 'left', state);
            if (isParenthesized(path.node.right))
                rightExpression = '(' + rightExpression + ')';
        }
    }
    else {
        leftExpression = traverseNode(path, path.node, 'right', state);
        if (isParenthesized(path.node.left))
            leftExpression = '(' + leftExpression + ')';

        rightExpression = traverseNode(path, path.node, 'left', state);
        if (isParenthesized(path.node.right))
            rightExpression = '(' + rightExpression + ')';
    }

    state.expression += leftExpression + ' ' + binaryOperatorToOdata(path.node.operator) + ' ' + rightExpression;
    path.skip();
}

function VisitCallExpression(path: NodePath<bt.CallExpression>, state: any): void {
    let node: bt.CallExpression = path.node;
    if (bt.isMemberExpression(node.callee)) {
        let propertyName: string = node.callee.property.name;
        let funcName: string = '';

        if (propertyName === 'ceil') {
            if (bt.isIdentifier(node.callee.object) && node.callee.object.name === 'Math')
                funcName = 'ceiling';
        }
        else if (propertyName === 'endsWith')
            funcName = 'endswith';
        else if (propertyName === 'floor') {
            if (bt.isIdentifier(node.callee.object) && node.callee.object.name === 'Math')
                funcName = 'floor';
        }
        else if (propertyName === 'getFullYear')
            funcName = 'year';
        else if (propertyName === 'getMonth')
            funcName = 'month';
        else if (propertyName === 'getDay')
            funcName = 'day';
        else if (propertyName === 'getHours')
            funcName = 'hour';
        else if (propertyName === 'getMinutes')
            funcName = 'minute';
        else if (propertyName === 'getSeconds')
            funcName = 'second';
        else if (propertyName === 'includes') {
            funcName = 'contains';
            if (isEntityProperty(node.arguments[0], state.paramName)) {
                let items: string;
                if (bt.isIdentifier(node.callee.object))
                    items = getVariableTextNode(node.callee.object, state.entitySetContext.odataNamespace, state.scope);
                else
                    items = traverseNode(path, node.callee.object, 'object', state);

                if (items === '')
                    throw new Error("Unsupported includes function");

                state.expression = getExpressionPropertyPath(node.arguments[0], state) + ' in (' + items + ')';
                path.skip();
                return;
            }
        }
        else if (propertyName === 'indexOf')
            funcName = 'indexof';
        else if (propertyName === 'round') {
            if (bt.isIdentifier(node.callee.object) && node.callee.object.name === 'Math')
                funcName = 'round';
        }
        else if (propertyName === 'startsWith')
            funcName = 'startswith';
        else if (propertyName === 'substring')
            funcName = 'substring';
        else if (propertyName === 'toLowerCase')
            funcName = 'tolower';
        else if (propertyName === 'toUpperCase')
            funcName = 'toupper';
        else if (propertyName === 'trim')
            funcName = 'trim';

        if (funcName !== '') {
            let argumentsLength: number = node.arguments.length;
            if (bt.isMemberExpression(node.callee.object))
                funcName += '(' + getExpressionPropertyPath(node.callee.object, state);
            else if (bt.isCallExpression(node.callee.object))
                funcName += '(' + traverseNode(path, node.callee, 'property', state);
            else if (bt.isIdentifier(node.callee.object)) {
                funcName += '(' + getExpressionPropertyPath(node.arguments[0] as bt.MemberExpression, state);
                argumentsLength = 0;
            }
            else
                throw Error('Unsupported function ' + propertyName)

            for (let i = 0; i < argumentsLength; i++)
                funcName += ',' + getVariableTextNode(node.arguments[i], state.entitySetContext.odataNamespace, state.scope);
            state.expression = funcName + ')';
            path.skip();
            return;
        }

        if (propertyName == 'arrayLength') {
            state.expression = getExpressionPropertyPath(node.arguments[0] as bt.MemberExpression, state) + '/$count';
            path.skip();
            return;
        }

        if (propertyName === 'stringLength') {
            state.expression = 'length(' + getExpressionPropertyPath(node.arguments[0] as bt.MemberExpression, state) + ')';
            state.kind = SelectKind.Compute;
            path.skip();
            return;
        }

        if (propertyName === 'concat') {
            funcName = getExpressionPropertyPath(node.callee.object as bt.MemberExpression, state);
            for (let i = 0; i < node.arguments.length; i++) {
                let argument: string = getVariableTextNode(node.arguments[i], state.entitySetContext.odataNamespace, state.scope);
                funcName = 'concat(' + funcName + ',' + argument + ')';
            }
            state.expression = funcName;
            path.skip();
            return;
        }

        if (propertyName === 'every' || propertyName === 'some') {
            funcName = propertyName === 'every' ? 'all' : 'any';
            let expression: string = parseNestedFunction(path, state);
            if (bt.isMemberExpression(node.callee.object))
                state.expression = node.callee.object.property.name + '/' + funcName + '(d:d/' + expression + ')';
            else
                throw Error('Call ' + propertyName + ' invalid object type ' + node.callee.object.type);
            path.skip();
            return;
        }

        if (state.entitySetContext.isGroupby()) {
            if (bhelpers.isFunctionExpression(node.arguments[0])) {
                let expression: string;
                let body: bt.Node = bhelpers.getFunctionBody(node.arguments[0]);
                if (bt.isMemberExpression(body))
                    expression = getExpressionPropertyPath(body, state);
                else
                    expression = parseNestedFunction(path, state);
                state.expression = expression + ' with ' + node.callee.property.name;
                path.skip();
            }
            else if (propertyName === 'count') {
                state.expression = '$count';
                path.skip();
            }
        }
    }
}
