import { parseExpression } from '@babel/parser';
import { default as traverse, default as visitors, Scope, TraverseOptions } from '@babel/traverse';
import * as bt from '@babel/types';
import { EntitySetContext } from '../../ts2odata/source/EntitySetContext';
import * as helpers from '../../ts2odata/source/helpers';
import { getQueryCache } from '../../ts2odata/source/QueryCache';
import * as types from '../../ts2odata/source/types';
import * as bhelpers from './helpers';
import { FilterVisitor, SelectVisitor } from './visitors';

export class Traverse implements types.TraverseBase {
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
	traverseFilter(entitySetContext: EntitySetContext, code: Function, scope?: object): string {
		let funcText: string = code.toString();
		let expression: string | undefined = getQueryCache(entitySetContext).getFilterExpression(funcText);
		if (expression)
			return scope === undefined ? expression : helpers.fillParameters(expression, scope, entitySetContext);

		let ast: bt.Expression = parseExpression(funcText);
		expression = this.traverseAstFilter(entitySetContext, ast, scope);

		getQueryCache(entitySetContext).addFilterExpression(funcText, expression);
		return scope === undefined ? expression : helpers.fillParameters(expression, scope, entitySetContext);
	}
	traversePropertyPath(code: Function): string {
		let funcText: string = code.toString();
		let propertyPath: string | undefined = getQueryCache().getPropertyPath(funcText);
		if (propertyPath)
			return propertyPath;

		let body: bt.Expression = bhelpers.getFunctionBody(parseExpression(funcText) as bt.ArrowFunctionExpression);
		propertyPath = this.traverseAstPropertyPath(body);
		if (propertyPath) {
			getQueryCache().addPropertyPath(funcText, propertyPath);
			return propertyPath;
		}

		throw new Error('Invalid function body ' + code);
	}
	traverseSelect(entitySetContext: EntitySetContext, code: Function, scope?: object): Array<types.SelectExpression> {
		let funcText: string = code.toString();
		let properties: Array<types.SelectExpression> | undefined = getQueryCache(entitySetContext).getSelectExpression(funcText);
		if (properties)
			return scope === undefined ? properties : helpers.fillSelectParameters(properties, scope, entitySetContext);

		let ast: bt.Expression = parseExpression(funcText);
		properties = this.traverseAstSelect(entitySetContext, ast, scope);
		getQueryCache(entitySetContext).addSelectExpression(funcText, properties);
		return scope === undefined ? properties : helpers.fillSelectParameters(properties, scope, entitySetContext);;
	}
}
