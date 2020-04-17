import { fetch, Headers, Request } from 'cross-fetch';
import { EntitySetContext } from './EntitySetContext';
import { OdataParser } from './OdataParser';
import * as types from './types';

export class EntitySet<TEntity extends object> {
    protected readonly entitySetContext: EntitySetContext;
    protected readonly traverse: types.TraverseBase;

    protected constructor(entitySetContext: EntitySetContext, traverse: types.TraverseBase) {
        this.entitySetContext = entitySetContext;
        this.traverse = traverse;
    }

    async count(): Promise<number> {
        let queryUrl: URL = this.getQueryUrl();
        queryUrl.pathname += '/$count';
        let request = new Request(queryUrl.href, {
            headers: new Headers({
                "Content-Type": "application/json"
            }),
            method: "GET"
        });
        let resonse: Response = await fetch(request);
        let body: string = await resonse.text();
        return parseInt(body);
    }
    static create<TEntity extends object>(traverse: types.TraverseBase, baseUrl: string, entitySet: string, odataNamespace?: string, odataParser?: OdataParser): EntitySet<TEntity> {
        if (baseUrl.charAt(baseUrl.length - 1) != '/')
            baseUrl += '/';
        return new EntitySet<TEntity>(new EntitySetContext(baseUrl, entitySet, null, '', odataNamespace, odataParser), traverse);
    }
    static default<TEntity extends object>(): EntitySet<TEntity> {
        return new EntitySet<TEntity>(new EntitySetContext('', '', null, '', ''), {} as types.TraverseBase);
    }
    expand<TProperty extends object | undefined, TItem extends types.Unpacked<TProperty> & object>(navigationProperty: (value: TEntity) => TProperty): ExpandableEntitySet<TEntity, TProperty, TItem> {
        let propertyPath: string = this.traverse.traversePropertyPath(navigationProperty);
        let expandContext: EntitySetContext = this.entitySetContext.getRoot().addExpand(propertyPath);
        return new ExpandableEntitySet<TEntity, TProperty, TItem>(expandContext, this.traverse);
    }
    filter(predicate: (value: types.DeepRequired<TEntity>) => boolean, scope?: object): EntitySet<TEntity> {
        this.entitySetContext.getRoot().addFilter(this.traverse.traverseFilter(this.entitySetContext, predicate, scope));
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
        let properties: Array<types.SelectExpression> = this.traverse.traverseSelect(this.entitySetContext, keySelector, scope);
        for (let i = 0; i < properties.length; i++)
            this.entitySetContext.addGroupBy(properties[i]);
        return new EntitySet<types.IGrouping<TKey, TEntity>>(this.entitySetContext, this.traverse);
    }
    key(key: any): EntitySet<TEntity>;
    key<TProperty extends object | undefined, TItem extends types.Unpacked<TProperty> & object>(key: any,
        propertyPath: (value: types.DeepRequired<TEntity>) => TProperty): EntitySet<TItem>;
    key<TProperty extends object>(key: any, navigationProperty?: (value: types.DeepRequired<TEntity>) => TProperty) {
        let propertyPath: string = '';
        if (navigationProperty)
            propertyPath = this.traverse.traversePropertyPath(navigationProperty);

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
        let propertyPath: string = this.traverse.traversePropertyPath(keySelector);
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
        let properties: Array<types.SelectExpression> = this.traverse.traverseSelect(this.entitySetContext, selector, scope);
        let root: EntitySetContext = this.entitySetContext.getRoot();
        for (let i = 0; i < properties.length; i++)
            root.addSelect(properties[i]);
        return new SelectableEntitySet<TEntity, TResult>(root, this.traverse);
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
        odataParser = this.entitySetContext.odataParser ?? odataParser;
        if (odataParser)
            return odataParser.parseEntitySet(body, this.entitySetContext.entitySet) as Array<TEntity>;
        else
            return OdataParser.parse(body) as Array<TEntity>;
    }
    top(count: number): EntitySet<TEntity> {
        this.entitySetContext.getRoot().setTop(count);
        return this;
    }
}

export class ExpandableEntitySet<TEntity extends object, TProperty extends object | undefined, TItem extends types.Unpacked<TProperty>> extends EntitySet<TEntity> {
    public constructor(entitySetContext: EntitySetContext, traverse: types.TraverseBase) {
        super(entitySetContext, traverse)
    }

    thenExpand<TNestedProperty extends object | undefined, TNestedItem extends types.Unpacked<TNestedProperty>>(navigationProperty: (value: TItem) => TNestedProperty)
        : ExpandableEntitySet<TEntity, TNestedProperty, TNestedItem> {
        let propertyPath: string = this.traverse.traversePropertyPath(navigationProperty);
        let expandContext: EntitySetContext = this.entitySetContext.addExpand(propertyPath);
        return new ExpandableEntitySet<TEntity, TNestedProperty, TNestedItem>(expandContext, this.traverse);
    }
    thenFilter(predicate: (value: Required<TItem>) => boolean, scope?: object): ExpandableEntitySet<TEntity, TProperty, TItem> {
        let expression: string = this.traverse.traverseFilter(this.entitySetContext, predicate, scope);
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
        let propertyPath: string = this.traverse.traversePropertyPath(keySelector);
        this.entitySetContext.addOrderby(propertyPath, direction);
        return this;
    }
    thenSelect<TResult extends object>(selector: (value: TItem) => TResult, scope?: object): SelectableEntitySet<TEntity, TResult> {
        let properties: Array<types.SelectExpression> = this.traverse.traverseSelect(this.entitySetContext, selector, scope);
        for (let i = 0; i < properties.length; i++)
            this.entitySetContext.addSelect(properties[i]);
        return new SelectableEntitySet<TEntity, TResult>(this.entitySetContext, this.traverse);
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
    public constructor(entitySetContext: EntitySetContext, traverse: types.TraverseBase) {
        super(entitySetContext, traverse)
    }

    asEntitySet(): EntitySet<TEntity> {
        return new EntitySet<TEntity>(this.entitySetContext.getRoot(), this.traverse);
    }
    filter(predicate: (value: types.NestedRequired<TResult>) => boolean, scope?: object): SelectableEntitySet<TEntity, TResult> {
        let expression: string = this.traverse.traverseFilter(this.entitySetContext, predicate, scope);
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
        let propertyPath: string = this.traverse.traversePropertyPath(keySelector);
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