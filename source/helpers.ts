import * as btypes from '@babel/types';

export function getPropertyPath(node: btypes.MemberExpression): string {
	let expression: string = '';
	do {
		expression = node.property.name + (expression === '' ? '' : '/' + expression);
		node = node.object as btypes.MemberExpression;
	}
	while (btypes.isMemberExpression(node));
	return expression;
}

export function getVariableTextValue(value: any, odataNamespace: string): string {
	switch (typeof value) {
		case 'string':
			return isEnumTextValue(value, odataNamespace) ? value : '\'' + value as string + '\'';
		case 'object':
			if (value === null)
				return 'null';
			else if (value instanceof Date)
				return (value as Date).toISOString();
			else if (Array.isArray(value)) {
				let items: string = '';
				for (let i = 0; i < value.length; i++) {
					items += getVariableTextValue(value[i], odataNamespace);
					if (i < value.length - 1)
						items += ',';
				}
				return items;
			}
			else
				return value.toString();
		default:
			return value.toString();
	}
}

export function isEnumTextValue(textValue: string, odataNamespace: string): boolean {
	if (!odataNamespace)
		return false;
	if (!textValue.startsWith(odataNamespace + '.'))
		return false;
	if (textValue[textValue.length - 1] !== '\'')
		return false;

	let i: number = textValue.indexOf('\'', odataNamespace.length + 1);
	return i > 0 && i < textValue.length - 2;
}

export function getFunctionBody(node: btypes.ArrowFunctionExpression | btypes.FunctionExpression): btypes.Expression {
	let expression: btypes.Node = node.body;
	if (btypes.isBlockStatement(expression))
		expression = expression.body[0];
	if (btypes.isReturnStatement(expression))
		expression = expression.argument as btypes.Expression;
	if (btypes.isExpression(expression))
		return expression;

	throw Error('Invalid function body type ' + node.body.type);
}