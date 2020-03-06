import * as bt from '@babel/types';

export function getFunctionBody(node: bt.ArrowFunctionExpression | bt.FunctionExpression): bt.Expression {
	let expression: bt.Node = node.body;
	if (bt.isBlockStatement(expression))
		expression = expression.body[0];
	if (bt.isReturnStatement(expression))
		expression = expression.argument as bt.Expression;
	if (bt.isExpression(expression))
		return expression;

	throw Error('Invalid function body type ' + node.body.type);
}

export function getNodePropertyPath(node: bt.MemberExpression): string {
	let propertyPath: string = '';
	do {
		propertyPath = node.property.name + (propertyPath === '' ? '' : '/' + propertyPath);
		node = node.object as bt.MemberExpression;
	}
	while (bt.isMemberExpression(node));
	return propertyPath;
}

