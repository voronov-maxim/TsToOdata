import { parseExpression } from '@babel/parser';
import traverse from '@babel/traverse';
import * as btypes from '@babel/types';
import { fetch, Headers, Request } from 'cross-fetch';
import { EntitySetContext } from './EntitySetContext';
import * as helpers from './helpers';
import { OdataParser } from './OdataParser';
import * as types from './types';
import { FilterVisitor, SelectVisitor } from './visitors';

export class EntitySet<TEntity extends object> {
    protected readonly entitySetContext: EntitySetContext;

    protected constructor(entitySetContext: EntitySetContext) {
        this.entitySetContext = entitySetContext;
    }

    count(): number {
        throw Error('TODO');
    }
    static create<TEntity extends object>(baseUrl: string, entitySet: string, odataNamespace?: string, odataParser?: OdataParser): EntitySet<TEntity> {
        if (baseUrl.charAt(baseUrl.length - 1) != '/')
            baseUrl += '/';
        return new EntitySet<TEntity>(new EntitySetContext(baseUrl, entitySet, null, '', odataNamespace, odataParser));
    }
    static default<TEntity extends object>(): EntitySet<TEntity> {
        return new EntitySet<TEntity>(new EntitySetContext('', '', null, '', ''));
    }
    expand<TProperty extends object | undefined, TItem extends types.Unpacked<TProperty> & object>(navigationProperty: (value: TEntity) => TProperty): ExpandableEntitySet<TEntity, TProperty, TItem> {
        let code = navigationProperty.toString();
        let propertyPath: string = this.traversePropertyPath(code);
        let expandContext: EntitySetContext = this.entitySetContext.getRoot().addExpand(propertyPath);
        return new ExpandableEntitySet<TEntity, TProperty, TItem>(expandContext);
    }
    filter(predicate: (value: types.DeepRequired<TEntity>) => boolean, scope?: object): EntitySet<TEntity> {
        let code = predicate.toString();
        this.entitySetContext.getRoot().addFilter(this.traverseFilter(code, scope));
        return this;
    }
    getQueryUrl(): URL {
        let root: EntitySetContext = this.entitySetContext.getRoot();
        let url = new URL(root.entitySet, root.baseUrl);

        let key = root.getKey();
        if (key !== '')
            url.pathname += key;

        let apply = root.getApply();
        if (apply !== '')
            url.searchParams.append('$apply', apply);

        let filter = root.getFilter();
        if (filter !== '')
            url.searchParams.append('$filter', filter);

        let expand: string = root.getExpand();
        if (expand !== '')
            url.searchParams.append('$expand', expand);

        let select: string = root.getSelect();
        if (select !== '')
            url.searchParams.append('$select', select);

        let compute: string = root.getCompute();
        if (compute !== '')
            url.searchParams.append('$compute', compute);

        let orderby: string = root.getOrderby();
        if (orderby !== '')
            url.searchParams.append('$orderby', orderby);

        let skip: string = root.getSkip();
        if (skip !== '')
            url.searchParams.append('$skip', skip);

        let top: string = root.getTop();
        if (top !== '')
            url.searchParams.append('$top', top);

        return url;
    }
    groupby<TKey extends object>(keySelector: (value: types.DeepRequired<TEntity>) => TKey, scope?: object): EntitySet<types.IGrouping<TKey, TEntity>> {
        let code = keySelector.toString();
        let properties: Array<types.SelectExpression> = this.traverseSelect(code, scope);
        for (let i = 0; i < properties.length; i++)
            this.entitySetContext.addGroupBy(properties[i]);
        return new EntitySet<types.IGrouping<TKey, TEntity>>(this.entitySetContext);
    }
    key(key: any): EntitySet<TEntity>;
    key<TProperty extends object | undefined, TItem extends types.Unpacked<TProperty> & object>(key: any,
        propertyPath: (value: types.DeepRequired<TEntity>) => TProperty): EntitySet<TItem>;
    key<TProperty extends object>(key: any, navigationProperty?: (value: types.DeepRequired<TEntity>) => TProperty) {
        let propertyPath: string = '';
        if (navigationProperty) {
            let code = navigationProperty.toString();
            propertyPath = this.traversePropertyPath(code);
        }

        this.entitySetContext.getRoot().setKey(key, propertyPath);
        return this;
    }
    orderby(keySelector: (value: types.DeepRequired<TEntity>) => types.NullableStructural): EntitySet<TEntity> {
        return this.orderbyImpl(keySelector, false);
    }
    orderbyDescending(keySelector: (value: types.DeepRequired<TEntity>) => types.NullableStructural): EntitySet<TEntity> {
        return this.orderbyImpl(keySelector, true);
    }
    orderbyImpl(keySelector: (value: types.DeepRequired<TEntity>) => types.NullableStructural, direction: boolean): EntitySet<TEntity> {
        let code = keySelector.toString();
        let propertyPath: string = this.traversePropertyPath(code);
        if (this.entitySetContext.isGroupby()) {
            propertyPath = propertyPath.substring('key.'.length);
            let selectExpression: types.SelectExpression | null = this.entitySetContext.getSelectExpressionByAlias(propertyPath);
            if (selectExpression === null)
                throw Error('Select property alias ' + propertyPath + ' not found');

            propertyPath = selectExpression.kind == types.SelectKind.Select ? selectExpression.expression : propertyPath;
        }

        this.entitySetContext.getRoot().addOrderby(propertyPath, direction);
        return this;
    }
    select<TResult extends object>(selector: (value: Required<TEntity>) => TResult, scope?: object): SelectableEntitySet<TEntity, TResult> {
        let code = selector.toString();
        let properties: Array<types.SelectExpression> = this.traverseSelect(code, scope);
        let root: EntitySetContext = this.entitySetContext.getRoot();
        for (let i = 0; i < properties.length; i++)
            root.addSelect(properties[i]);
        return new SelectableEntitySet<TEntity, TResult>(root);
    }
    skip(count: number): EntitySet<TEntity> {
        this.entitySetContext.getRoot().setSkip(count);
        return this;
    }
    async toArrayAsync(odataParser?: OdataParser): Promise<Array<TEntity>> {
        let request = new Request(this.getQueryUrl().href, {
            headers: new Headers({
                "Content-Type": "application/json"
            }),
            method: "GET"
        });
        let resonse: Response = await fetch(request);
        let body: string = await resonse.text();
        if (odataParser)
            return odataParser.parseEntitySet(body, this.entitySetContext.entitySet) as Array<TEntity>;
        else
            return OdataParser.parse(body) as Array<TEntity>;
    }
    top(count: number): EntitySet<TEntity> {
        this.entitySetContext.getRoot().setTop(count);
        return this;
    }
    protected traverseFilter(code: string, scope?: object): string {
        let ast: btypes.Expression = parseExpression(code);
        let visitor = new FilterVisitor();
        let state = {
            entitySetContext: this.entitySetContext,
            expression: '',
            scope,
            visitor
        };
        traverse(ast, visitor, {}, state);
        return state.expression;
    }
    protected traversePropertyPath(code: string): string {
        let body: btypes.Expression = helpers.getFunctionBody(parseExpression(code) as btypes.ArrowFunctionExpression);
        if (btypes.isMemberExpression(body))
            return helpers.getPropertyPath(body);

        throw new Error('Invalid function body ' + code);
    }
    protected traverseSelect(code: string, scope?: object): Array<types.SelectExpression> {
        let ast: btypes.Expression = parseExpression(code);
        let visitor = new SelectVisitor();
        let state = {
            entitySetContext: this.entitySetContext,
            scope,
            properties: new Array<types.SelectExpression>(),
            visitor
        };
        traverse(ast, visitor, {}, state);
        return state.properties;
    }
}

export class ExpandableEntitySet<TEntity extends object, TProperty extends object | undefined, TItem extends types.Unpacked<TProperty>> extends EntitySet<TEntity> {
    public constructor(entitySetContext: EntitySetContext) {
        super(entitySetContext)
    }

    thenExpand<TNestedProperty extends object | undefined, TNestedItem extends types.Unpacked<TNestedProperty>>(navigationProperty: (value: TItem) => TNestedProperty)
        : ExpandableEntitySet<TEntity, TNestedProperty, TNestedItem> {
        let code = navigationProperty.toString();
        let propertyPath: string = this.traversePropertyPath(code);
        let expandContext: EntitySetContext = this.entitySetContext.addExpand(propertyPath);
        return new ExpandableEntitySet<TEntity, TNestedProperty, TNestedItem>(expandContext);
    }
    thenFilter(predicate: (value: Required<TItem>) => boolean, scope?: object): ExpandableEntitySet<TEntity, TProperty, TItem> {
        let code = predicate.toString();
        let expression: string = this.traverseFilter(code, scope);
        this.entitySetContext.addFilter(expression);
        return this;
    }
    thenOrderby(keySelector: (value: TItem) => types.NullableStructural): ExpandableEntitySet<TEntity, TProperty, TItem> {
        return this.thenOrderbyImpl(keySelector, false);
    }
    thenOrderbyDescending(keySelector: (value: TItem) => types.NullableStructural): ExpandableEntitySet<TEntity, TProperty, TItem> {
        return this.thenOrderbyImpl(keySelector, true);
    }
    thenOrderbyImpl(keySelector: (value: TItem) => types.NullableStructural, direction: boolean): ExpandableEntitySet<TEntity, TProperty, TItem> {
        let code = keySelector.toString();
        let body: btypes.Expression = helpers.getFunctionBody(parseExpression(code) as btypes.ArrowFunctionExpression);
        let propertyPath: string = this.traversePropertyPath(code);
        this.entitySetContext.addOrderby(propertyPath, direction);
        return this;
    }
    thenSelect<TResult extends object>(selector: (value: TItem) => TResult, scope?: object): SelectableEntitySet<TEntity, TResult> {
        let code = selector.toString();
        let properties: Array<types.SelectExpression> = this.traverseSelect(code, scope);
        for (let i = 0; i < properties.length; i++)
            this.entitySetContext.addSelect(properties[i]);
        return new SelectableEntitySet<TEntity, TResult>(this.entitySetContext);
    }
    thenSkip(count: number): EntitySet<TEntity> {
        this.entitySetContext.setSkip(count);
        return this;
    }
    thenTop(count: number): EntitySet<TEntity> {
        this.entitySetContext.setTop(count);
        return this;
    }
}

export class SelectableEntitySet<TEntity extends object, TResult extends object> extends EntitySet<TEntity | TResult> {
    public constructor(entitySetContext: EntitySetContext) {
        super(entitySetContext)
    }

    asEntitySet(): EntitySet<TEntity> {
        return new EntitySet<TEntity>(this.entitySetContext.getRoot());
    }
    filter(predicate: (value: types.NestedRequired<TResult>) => boolean, scope?: object): SelectableEntitySet<TEntity, TResult> {
        let code = predicate.toString();
        let expression: string = this.traverseFilter(code, scope);
        this.entitySetContext.addFilter(expression);
        return this;
    }
    orderby(keySelector: (value: types.DeepRequired<TResult>) => types.NullableStructural): SelectableEntitySet<TEntity, TResult> {
        return this.orderbyImpl(keySelector, false);
    }
    orderbyDescending(keySelector: (value: types.DeepRequired<TResult>) => types.NullableStructural): SelectableEntitySet<TEntity, TResult> {
        return this.orderbyImpl(keySelector, true);
    }
    orderbyImpl(keySelector: (value: types.DeepRequired<TResult>) => types.NullableStructural, direction: boolean): SelectableEntitySet<TEntity, TResult> {
        let code = keySelector.toString();
        let propertyPath: string = this.traversePropertyPath(code);
        let selectExpression: types.SelectExpression | null = this.entitySetContext.getSelectExpressionByAlias(propertyPath);
        if (selectExpression === null)
            throw Error('Select property alias ' + propertyPath + ' not found');

        let property: string = selectExpression.kind == types.SelectKind.Select ? selectExpression.expression : propertyPath;
        this.entitySetContext.addOrderby(property, direction);
        return this;
    }
    skip(count: number): SelectableEntitySet<TEntity, TResult> {
        this.entitySetContext.setSkip(count);
        return this;
    }
    top(count: number): SelectableEntitySet<TEntity, TResult> {
        this.entitySetContext.setTop(count);
        return this;
    }
}
