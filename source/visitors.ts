import traverse from '@babel/traverse';
import visitors from '@babel/traverse';
import { NodePath } from '@babel/traverse';
import * as btypes from '@babel/types';
import * as helpers from './helpers';
import { SelectExpression, SelectKind } from './types';
import { EntitySetContext } from './EntitySetContext'

export class FilterVisitor {
	BinaryExpression = function (path: NodePath) {
		let node = path.node as btypes.BinaryExpression;

		let leftExpression: string = traverseNode(path, path.node, 'right');
		if (isParenthesized(node.left))
			leftExpression = '(' + leftExpression + ')';

		let rightExpression: string = traverseNode(path, path.node, 'left');
		if (isParenthesized(node.right))
			rightExpression = '(' + rightExpression + ')';

		path.state.expression += leftExpression + ' ' + binaryOperatorToOdata(node.operator) + ' ' + rightExpression;
		path.skip();
	}
	BooleanLiteral = function (path: NodePath) {
		let node = path.node as btypes.BooleanLiteral;

		if (path.state.expression !== '')
			path.state.expression += ',';
		path.state.expression += node.value.toString();
	}
	CallExpression = function (path: NodePath) {
		let node = path.node as btypes.CallExpression;

		if (btypes.isMemberExpression(node.callee)) {
			let propertyName: string = node.callee.property.name;
			let funcName: string = '';

			if (propertyName === 'endsWith')
				funcName = 'endswith';
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
				if (isEntityProperty(node.arguments[0], path.state.paramName)) {
					let items: string;
					if (btypes.isIdentifier(node.callee.object))
						items = getVariableTextNode(node.callee.object, path.state.entitySetContext.odataNamespace, path.state.scope);
					else
						items = traverseNode(path, node.callee.object, 'object');

					if (items === '')
						throw new Error("Unsupported includes function");

					path.state.expression = getPropertyPath(node.arguments[0] as btypes.MemberExpression, path.state) + ' in (' + items + ')';
					path.skip();
					return;
				}
			}
			else if (propertyName === 'indexOf')
				funcName = 'indexof';
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
				if (btypes.isMemberExpression(node.callee.object))
					funcName += '(' + getPropertyPath(node.callee.object, path.state);
				else
					funcName += '(' + traverseNode(path, node.callee, 'property');

				for (let i = 0; i < node.arguments.length; i++)
					funcName += ',' + getVariableTextNode(node.arguments[i], path.state.entitySetContext.odataNamespace, path.state.scope);
				path.state.expression = funcName + ')';
				path.skip();
				return;
			}

			if (propertyName == 'arrayLength') {
				path.state.expression = getPropertyPath(node.arguments[0] as btypes.MemberExpression, path.state) + '/$count';
				path.skip();
				return;
			}

			if (propertyName === 'stringLength') {
				path.state.expression = 'length(' + getPropertyPath(node.arguments[0] as btypes.MemberExpression, path.state) + ')';
				path.state.kind = SelectKind.Compute;
				path.skip();
				return;
			}

			if (propertyName === 'concat') {
				funcName = getPropertyPath(node.callee.object as btypes.MemberExpression, path.state);
				for (let i = 0; i < node.arguments.length; i++) {
					let argument: string = getVariableTextNode(node.arguments[i], path.state.entitySetContext.odataNamespace, path.state.scope);
					funcName = 'concat(' + funcName + ',' + argument + ')';
				}
				path.state.expression = funcName;
				path.skip();
				return;
			}

			if (propertyName === 'every' || propertyName === 'some') {
				funcName = propertyName === 'every' ? 'all' : 'any';
				let expression: string = parseNestedFunction(path);
				if (btypes.isMemberExpression(node.callee.object))
					path.state.expression = node.callee.object.property.name + '/' + funcName + '(d:d/' + expression + ')';
				else
					throw Error('Call ' + propertyName + ' invalid object type ' + node.callee.object.type);
				path.skip();
				return;
			}

			if (path.state.entitySetContext.isGroupby()) {
				if (isFunctionExpression(node.arguments[0])) {
					let expression: string;
					let body: btypes.Node = helpers.getFunctionBody(node.arguments[0]);
					if (btypes.isMemberExpression(body))
						expression = getPropertyPath(body, path.state);
					else
						expression = parseNestedFunction(path);
					path.state.expression = expression + ' with ' + node.callee.property.name;
					path.skip();
				}
				else if (propertyName === 'count') {
					path.state.expression = '$count';
					path.skip();
				}
			}
		}
	}
	Identifier = function (path: NodePath) {
		let node = path.node as btypes.Identifier;

		if (path.listKey === 'params' && isFunctionExpression(path.parent))
			path.state.paramName = node.name;
		else
			path.state.expression = getVariableTextNode(path.node, path.state.entitySetContext.odataNamespace, path.state.scope);
	}
	LogicalExpression = function (path: NodePath) {
		path.state.visitor.BinaryExpression.enter[0](path);
	}
	MemberExpression = function (path: NodePath) {
		let node = path.node as btypes.MemberExpression;

		let expression: string;
		if (isEntityProperty(path.node, path.state.paramName))
			expression = getPropertyPath(node, path.state);
		else
			expression = getVariableTextNode(path.node, path.state.entitySetContext.odataNamespace, path.state.scope);

		if (path.state.expression === '')
			path.state.expression = expression;
		else
			path.state.expression += ',' + expression;
		path.skip();
	}
	NewExpression = function (path: NodePath) {
		let node = path.node as btypes.NewExpression;

		if (btypes.isIdentifier(node.callee) && node.callee.name == 'Date')
			if (btypes.isStringLiteral(node.arguments[0])) {
				path.state.expression = new Date(node.arguments[0].value).toISOString();
				path.skip();
				return;
			}

		throw new Error('Not supported');
	}
	NullLiteral = function (path: NodePath) {
		if (path.state.expression !== '')
			path.state.expression += ',';
		path.state.expression += 'null';
	}
	NumericLiteral = function (path: NodePath) {
		let node = path.node as btypes.NumberLiteral;

		if (path.state.expression !== '')
			if (!btypes.isUnaryExpression(path.parent))
				path.state.expression += ',';
		path.state.expression += node.value.toString();
	}
	StringLiteral = function (path: NodePath) {
		let node = path.node as btypes.StringLiteral;

		if (path.state.expression !== '')
			path.state.expression += ',';
		path.state.expression += '\'' + node.value.toString() + '\'';
	}
	UnaryExpression = function (path: NodePath) {
		let node = path.node as btypes.UnaryExpression;

		path.state.expression = node.operator;
	}
}

export class SelectVisitor {
	Identifier = function (path: NodePath) {
		let node = path.node as btypes.Identifier;

		if (path.listKey === 'params' && isFunctionExpression(path.parent))
			path.state.paramName = node.name;
	}
	Property = function (path: NodePath) {
		let node = path.node as btypes.ObjectProperty;

		let expression: string;
		let isCompute = !btypes.isMemberExpression(node.value);
		let kind: SelectKind;
		if (isCompute) {
			let state = {
				visitor: new FilterVisitor(),
				scope: path.state.scope,
				expression: '',
				paramName: path.state.paramName,
				entitySetContext: path.state.entitySetContext,
				kind: path.state.entitySetContext.isGroupby() ? SelectKind.Aggregate : SelectKind.Compute
			};
			visitors.explode(state.visitor);
			traverse.node(path.node, state.visitor, path.scope, state, path, { key: true });
			expression = state.expression;
			kind = state.kind;
		}
		else {
			if (btypes.isMemberExpression(node.value))
				expression = helpers.getPropertyPath(node.value);
			else
				throw Error('Property value must be member expression');

			if (path.state.entitySetContext.isGroupby() && expression.startsWith('key/')) {
				let alias: string = expression.substring('key/'.length);
				expression = path.state.entitySetContext.getSelectExpressionByAlias(alias).expression;
			}
			kind = SelectKind.Select;
		}

		let properties = path.state.properties as Array<SelectExpression>;
		properties.push(new SelectExpression(expression, node.key.name, kind));
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

function getPropertyPath(node: btypes.MemberExpression, state: any): string {
	let propertyPath = helpers.getPropertyPath(node);
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

function getVariableTextNode(node: btypes.Node, odataNamespace: string, scope?: any): string {
	if (scope)
		if (btypes.isIdentifier(node) || btypes.isMemberExpression(node)) {
			let parameterName: string = btypes.isMemberExpression(node) ? node.property.name : node.name;
			let value: any = scope[parameterName];
			if (value !== undefined)
				return helpers.getVariableTextValue(value, odataNamespace);

			if (btypes.isIdentifier(node))
				throw Error(node.name + ' not found in scope');
		}

	if (btypes.isStringLiteral(node)) {
		if (helpers.isEnumTextValue(node.value, odataNamespace))
			return node.value;
		return '\'' + node.value + '\''
	}

	if (btypes.isNumericLiteral(node))
		return node.value.toString();

	if (btypes.isNullLiteral(node))
		return 'null';

	if (btypes.isMemberExpression(node)) {
		let expression: string = '';
		if (odataNamespace) {
			if (btypes.isMemberExpression(node.object)) {
				if (btypes.isIdentifier(node.object.property))
					expression = odataNamespace + '.' + node.object.property.name;
				else if (btypes.isStringLiteral(node.object.property))
					expression = odataNamespace + '.' + node.object.property.value;
				else
					throw Error('Unknown enum property type ' + node.object.property.type);
			}
			else if (btypes.isIdentifier(node.object))
				expression = odataNamespace + '.' + node.object.name;
			else
				throw new Error("Unknown text value " + node.type)
		}
		return expression + '\'' + node.property.name + '\'';
	}

	throw Error('getVariableTextNode invalid node type ' + node.type);
}

function isEntityProperty(node: btypes.Node, paramName: string): boolean {
	if (btypes.isMemberExpression(node)) {
		do {
			node = node.object;
		}
		while (btypes.isMemberExpression(node));
		return btypes.isIdentifier(node) && node.name === paramName;
	}

	return false;
}

function isFunctionExpression(node: btypes.Node): node is btypes.ArrowFunctionExpression | btypes.FunctionExpression {
	return btypes.isArrowFunctionExpression(node) || btypes.isFunctionExpression(node);
}

function isParenthesized(node: btypes.Node) {
	return (node as any).extra?.parenthesized === true;
}

function parseNestedFunction(path: NodePath): string {
	let node = path.node as btypes.CallExpression;

	if (!(isFunctionExpression(node.arguments[0]) && btypes.isIdentifier(node.arguments[0].params[0])))
		throw Error('Argument must be function');

	let state = {
		visitor: path.state.visitor,
		entitySetContext: path.state.entitySetContext,
		scope: path.state.scope,
		expression: '',
		paramName: node.arguments[0].params[0].name
	};
	if (btypes.isArrowFunctionExpression(node.arguments[0]))
		traverse.node(node.arguments[0], path.state.visitor, path.scope, state, path, { params: true });
	else
		traverse.node(node.arguments[0].body, path.state.visitor, path.scope, state, path);
	return state.expression;
}

function traverseNode(path: NodePath, node: btypes.Node, skipKey: string): string {
	let state = {
		visitor: path.state.visitor,
		scope: path.state.scope,
		expression: '',
		paramName: path.state.paramName,
		entitySetContext: path.state.entitySetContext
	};
	let skipKeys: any = {};
	skipKeys[skipKey] = true;
	traverse.node(node, path.state.visitor, path.scope, state, path, skipKeys);
	return state.expression;
}
