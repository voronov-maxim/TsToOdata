import { parseExpression } from '@babel/parser';
import { default as traverse, default as visitors, Scope, TraverseOptions } from '@babel/traverse';
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
		(visitors as any).explode(this.filterVisitor);
		(visitors as any).explode(this.selectVisitor);
	}

	traverseAstFilter(entitySetContext: EntitySetContext, ast: bt.Expression, scope?: object): string {
		let state = {
			entitySetContext,
			expression: '',
			scope,
			visitor: this.filterVisitor
		};
		traverse(ast, state.visitor as TraverseOptions, {} as Scope, state);
		return state.expression;
	}
	traverseAstPropertyPath(ast: bt.Expression): string | undefined {
		return bt.isMemberExpression(ast) ? bhelpers.getNodePropertyPath(ast) : undefined;
	}
	traverseAstSelect(entitySetContext: EntitySetContext, ast: bt.Expression, scope?: object): Array<types.SelectExpression> {
		let state = {
			entitySetContext,
			scope,
			properties: new Array<types.SelectExpression>(),
			visitor: this.selectVisitor,
			filterVisitor: this.filterVisitor
		};
		traverse(ast, state.visitor as TraverseOptions, {} as Scope, state);
		return state.properties;
	}
	traverseFilter(entitySetContext: EntitySetContext, code: string, scope?: object): string {
		let expression: string | undefined = getQueryCache(entitySetContext).getFilterExpression(code);
		if (expression)
			return scope === undefined ? expression : helpers.fillParameters(expression, scope, entitySetContext);

		let ast: bt.Expression = parseExpression(code);
		expression = this.traverseAstFilter(entitySetContext, ast, scope);

		getQueryCache(entitySetContext).addFilterExpression(code, expression);
		return scope === undefined ? expression : helpers.fillParameters(expression, scope, entitySetContext);
	}
	traversePropertyPath(code: string): string {
		let propertyPath: string | undefined = getQueryCache().getPropertyPath(code);
		if (propertyPath)
			return propertyPath;

		let body: bt.Expression = bhelpers.getFunctionBody(parseExpression(code) as bt.ArrowFunctionExpression);
		propertyPath = this.traverseAstPropertyPath(body);
		if (propertyPath) {
			getQueryCache().addPropertyPath(code, propertyPath);
			return propertyPath;
		}

		throw new Error('Invalid function body ' + code);
	}
	traverseSelect(entitySetContext: EntitySetContext, code: string, scope?: object): Array<types.SelectExpression> {
		let properties: Array<types.SelectExpression> | undefined = getQueryCache(entitySetContext).getSelectExpression(code);
		if (properties)
			return scope === undefined ? properties : helpers.fillSelectParameters(properties, scope, entitySetContext);

		let ast: bt.Expression = parseExpression(code);
		properties = this.traverseAstSelect(entitySetContext, ast, scope);
		getQueryCache(entitySetContext).addSelectExpression(code, properties);
		return scope === undefined ? properties : helpers.fillSelectParameters(properties, scope, entitySetContext);;
	}
}
