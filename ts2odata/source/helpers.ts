import * as types from './types';
import { EntitySetContext } from './EntitySetContext';

export function fillParameters(expression: string, scope: object, entitySetContext: EntitySetContext): string {
	let fixEnum: boolean = isFixEnum(entitySetContext);
	for (let parameterName in scope) {
		let i: number;
		let value: any = scope[parameterName];
		let text: string;
		if (fixEnum && typeof value === 'string' && isEnumTextValue(value, entitySetContext.odataNamespace)) {
			i = value.lastIndexOf('\'', value.length - 2);
			text = value.substring(i + 1, value.length - 1);
		}
		else
			text = getVariableTextValue(value, entitySetContext.odataNamespace);

		while ((i = expression.indexOf('{' + parameterName + '}')) >= 0) {
			if (fixEnum && i > 2 && expression[i - 1] === '@') {
				let j: number = expression.lastIndexOf('@', i - 2);
				if (value === null) {
					expression = expression.substring(0, j) + expression.substring(i, i + parameterName.length + 2) + expression.substring(i + parameterName.length + 3);
					i = j;
				}
				else {
					expression = expression.substring(0, j) + expression.substring(j + 1, i - 1) + expression.substring(i);
					i -= 2;

					if (text[0] === '\'')
						text = text.substring(1, text.length - 1);
				}
			}

			expression = expression.substring(0, i) + text + expression.substring(i + parameterName.length + 2);
		}
	}
	return expression;
}

export function fillSelectParameters(selectExpressions: Array<types.SelectExpression>, scope: object, entitySetContext: EntitySetContext): Array<types.SelectExpression> {
	for (let i: number = 0; i < selectExpressions.length; i++) {
		let expression: string = fillParameters(selectExpressions[i].expression, scope, entitySetContext);
		if (selectExpressions[i].expression !== expression)
			selectExpressions[i] = new types.SelectExpression(expression, selectExpressions[i].alias, selectExpressions[i].kind);
	}
	return selectExpressions;
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

export function isFixEnum(entitySetContext: EntitySetContext): boolean {
	return entitySetContext.odataParser !== undefined && entitySetContext.odataNamespace !== '';
}