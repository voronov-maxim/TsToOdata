import { EntitySetContext } from './EntitySetContext';
import * as helpers from './helpers';
import { getQueryCache } from './QueryCache';
import * as types from './types';

export class CacheTraverse implements types.Traverse {
	traverseFilter(entitySetContext: EntitySetContext, code: string, scope?: object): string {
		let expression: string | undefined = getQueryCache(entitySetContext).getFilterExpression(code);
		if (expression)
			return scope === undefined ? expression : helpers.fillParameters(expression, scope, entitySetContext);

		throw new Error('Code filter ' + code + ' not found in cache');
	}
	traversePropertyPath(code: string): string {
		let propertyPath: string | undefined = getQueryCache().getPropertyPath(code);
		if (propertyPath)
			return propertyPath;

		throw new Error('Code property path ' + code + ' not found in cache');
	}
	traverseSelect(entitySetContext: EntitySetContext, code: string, scope?: object): Array<types.SelectExpression> {
		let expression: Array<types.SelectExpression> | undefined = getQueryCache(entitySetContext).getSelectExpression(code);
		if (expression)
			return scope === undefined ? expression : helpers.fillSelectParameters(expression, scope, entitySetContext);

		throw new Error('Code select ' + code + ' not found in cache');
	}
}
