import { parseExpression } from '@babel/parser';
import { default as traverse, default as visitors } from '@babel/traverse';
import * as bt from '@babel/types';
import { EntitySetContext } from '../EntitySetContext';
import * as helpers from '../helpers';
import { getQueryCache } from '../QueryCache';
import * as types from '../types';
import * as bhelpers from './helpers';
import { FilterVisitor, SelectVisitor } from './visitors';

export class BabelTraverse implements types.Traverse {
	private readonly filterVisitor: FilterVisitor;
	private readonly selectVisitor: SelectVisitor;

	constructor() {
		this.filterVisitor = new FilterVisitor();
		this.selectVisitor = new SelectVisitor();
		visitors.explode(this.filterVisitor);
		visitors.explode(this.selectVisitor);
	}

	traverseFilter(entitySetContext: EntitySetContext, code: string, scope?: object): string {
		let expression: string | undefined = getQueryCache(entitySetContext).getFilterExpression(code);
		if (expression)
			return scope === undefined ? expression : helpers.fillParameters(expression, scope, entitySetContext);

		let ast: bt.Expression = parseExpression(code);
		let state = {
			entitySetContext,
			expression: '',
			scope,
			visitor: this.filterVisitor
		};
		traverse(ast, state.visitor, {}, state);

		getQueryCache(entitySetContext).addFilterExpression(code, state.expression);
		return scope === undefined ? state.expression : helpers.fillParameters(state.expression, scope, entitySetContext);
	}
	traversePropertyPath(code: string): string {
		let propertyPath: string | undefined = getQueryCache().getPropertyPath(code);
		if (propertyPath)
			return propertyPath;

		let body: bt.Expression = bhelpers.getFunctionBody(parseExpression(code) as bt.ArrowFunctionExpression);
		if (bt.isMemberExpression(body)) {
			propertyPath = bhelpers.getNodePropertyPath(body);
			getQueryCache().addPropertyPath(code, propertyPath);
			return propertyPath;
		}

		throw new Error('Invalid function body ' + code);
	}
	traverseSelect(entitySetContext: EntitySetContext, code: string, scope?: object): Array<types.SelectExpression> {
		let expression: Array<types.SelectExpression> | undefined = getQueryCache(entitySetContext).getSelectExpression(code);
		if (expression)
			return scope === undefined ? expression : helpers.fillSelectParameters(expression, scope, entitySetContext);

		let ast: bt.Expression = parseExpression(code);
		let state = {
			entitySetContext,
			scope,
			properties: new Array<types.SelectExpression>(),
			visitor: this.selectVisitor,
			filterVisitor: this.filterVisitor
		};
		traverse(ast, state.visitor, {}, state);

		getQueryCache(entitySetContext).addSelectExpression(code, state.properties);
		return scope === undefined ? state.properties : helpers.fillSelectParameters(state.properties, scope, entitySetContext);;
	}
}
