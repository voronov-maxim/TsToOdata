import * as bt from '@babel/types';
import * as helpers from './helpers';
import { EntityDefinition, OdataParser, PropertyDefinition } from './OdataParser';
import { SelectExpression, SelectKind } from './types';

type OrderbyItem = { property: string, direction: boolean };
type FilterByItem = { expression: string, isBeforeApply: boolean };

export class EntitySetContext {
    private readonly parent: EntitySetContext | null;

    private readonly expandItems: Array<EntitySetContext>;
    private readonly filterItems: Array<FilterByItem>;
    private readonly groupbyItems: Array<SelectExpression>;
    private readonly orderbyItems: Array<OrderbyItem>;
    private readonly selectItems: Array<SelectExpression>;
    private keyItem: any;
    private navigationPathItem: string;
    private readonly navigationProperty: string;
    private skipItem: number;
    private topItem: number;

    constructor(baseUrl: string, entitySet: string, parent: EntitySetContext | null, navigationProperty: string, odataNamespace?: string, odataParser?: OdataParser) {
        this.baseUrl = baseUrl;
        this.entitySet = entitySet;
        this.parent = parent;
        this.navigationProperty = navigationProperty;
        this.odataNamespace = odataNamespace ?? '';
        this.odataParser = odataParser;

        this.expandItems = new Array<EntitySetContext>();
        this.filterItems = new Array<FilterByItem>();
        this.groupbyItems = new Array<SelectExpression>();
        this.orderbyItems = new Array<OrderbyItem>();
        this.selectItems = new Array<SelectExpression>();
        this.keyItem = '';
        this.navigationPathItem = '';
        this.skipItem = NaN;
        this.topItem = NaN;
    }

    addExpand(property: string): EntitySetContext {
        let navigationItem: EntitySetContext | null = this.findExpandItem(property);
        if (navigationItem === null) {
            navigationItem = new EntitySetContext(this.baseUrl, this.entitySet, this, property, this.odataNamespace, this.odataParser);
            this.expandItems.push(navigationItem);
        }
        return navigationItem;
    }
    addFilter(expression: string) {
        this.filterItems.push({ expression, isBeforeApply: false });
    }
    addGroupBy(key: SelectExpression) {
        this.groupbyItems.push(key);

        for (let i = 0; i < this.filterItems.length; i++)
            this.filterItems[i].isBeforeApply = true;
    }
    addOrderby(property: string, direction: boolean) {
        this.orderbyItems.push({ property: property, direction: direction });
    }
    addSelect(property: SelectExpression): void {
        if (!this.findSelectItem(property))
            this.selectItems.push(property);
    }
    private findExpandItem(property: string): EntitySetContext | null {
        for (let i = 0; i < this.expandItems.length; i++)
            if (this.expandItems[i].navigationProperty === property)
                return this.expandItems[i];

        return null;
    }
    private findSelectItem(property: SelectExpression): boolean {
        for (let i = 0; i < this.selectItems.length; i++)
            if (this.selectItems[i].expression === property.expression)
                return true;

        return false;
    }
    getApply(): string {
        let keys: string = '';
        if (!this.isGroupby())
            return keys;

        let filter: string = this.getFilterIsBeforeApply(true);
        if (filter !== '')
            keys = 'filter(' + filter + ')/';

        keys += 'groupby((';
        for (let i = 0; i < this.groupbyItems.length; i++) {
            keys += this.groupbyItems[i].expression;
            if (i < this.groupbyItems.length - 1)
                keys += ',';
        }
        keys += ')';

        let aggregate: string = this.getSelectKind(SelectKind.Aggregate);
        if (aggregate !== '')
            aggregate = ',aggregate(' + aggregate + ')';

        keys += aggregate + ')';

        let compute: string = this.getSelectKind(SelectKind.Compute);
        if (compute !== '')
            keys += '/compute(' + compute + ')';

        return keys;
    }
    getCompute(): string {
        return this.isGroupby() ? '' : this.getSelectKind(SelectKind.Compute);
    }
    getEntityDefinition(navigationPath?: bt.MemberExpression): EntityDefinition {
        if (!this.odataParser)
            throw Error('OdataPaser not defined');

        let navigationProperties = new Array<string>();
        let entitySetContext: EntitySetContext = this;
        while (entitySetContext.parent) {
            navigationProperties.push(entitySetContext.navigationProperty);
            entitySetContext = entitySetContext.parent;
        }

        let entityDef = this.odataParser.enitites.get(entitySetContext.entitySet) as EntityDefinition;
        while (navigationProperties.length > 0) {
            let propertyDef: PropertyDefinition = entityDef.properties.get(navigationProperties.pop() as string) as PropertyDefinition;
            entityDef = propertyDef.propertyType as EntityDefinition;
        }

        if (navigationPath) {
            let navigationProperties = new Array<string>();
            let node: bt.MemberExpression = navigationPath;
            while (bt.isMemberExpression(node.object)) {
                node = node.object;
                navigationProperties.push(node.property.name);
            }

            while (navigationProperties.length > 0) {
                let propertyDef: PropertyDefinition = entityDef.properties.get(navigationProperties.pop() as string) as PropertyDefinition;
                entityDef = propertyDef.propertyType as EntityDefinition;
            }
        }

        return entityDef;
    }
    getExpand(): string {
        let expanded: string = '';
        for (let i = 0; i < this.expandItems.length; i++) {
            if (expanded !== '')
                expanded += ','
            expanded += this.expandItems[i].getExpand();
        }

        if (this.parent === null)
            return expanded;

        let nested: string = '';
        if (expanded !== '')
            nested += '$expand=' + expanded;

        let filter: string = this.getFilter();
        if (filter !== '') {
            if (nested !== '')
                nested += ';';
            nested += '$filter=' + filter;
        }

        let selected: string = this.getSelect();
        if (selected !== '') {
            if (nested !== '')
                nested += ';';
            nested += '$select=' + selected;
        }

        let orderby: string = this.getOrderby();
        if (orderby !== '') {
            if (nested !== '')
                nested += ';';
            nested += '$orderby=' + orderby;
        }

        let skip: string = this.getSkip();
        if (skip !== '') {
            if (nested !== '')
                nested += ';';
            nested += '$skip=' + skip;
        }

        let top: string = this.getTop();
        if (top !== '') {
            if (nested !== '')
                nested += ';';
            nested += '$top=' + top;
        }

        if (nested === '')
            return this.navigationProperty;

        return this.navigationProperty + '(' + nested + ')';
    }
    getFilter(): string {
        return this.getFilterIsBeforeApply(false);
    }
    getFilterIsBeforeApply(isBeforeApply: boolean): string {
        let filter: string = '';
        for (let i = 0; i < this.filterItems.length; i++)
            if (this.filterItems[i].isBeforeApply === isBeforeApply)
                if (filter == '')
                    filter = this.filterItems[i].expression;
                else {
                    filter = '(' + filter + ') and ';
                    filter += '(' + this.filterItems[i].expression + ')';
                }
        return filter;
    }
    getKey(): string {
        if (this.keyItem === '')
            return '';

        let key: string = '';
        if (typeof this.keyItem === 'object') {
            for (const keyItem in this.keyItem) {
                if (key !== '')
                    key += ','
                key += keyItem + '=' + helpers.getVariableTextValue(this.keyItem[keyItem], this.odataNamespace);
            }
        }
        else
            key = helpers.getVariableTextValue(this.keyItem, this.odataNamespace);

        key = '(' + key + ')';
        if (this.navigationPathItem !== '')
            key += '/' + this.navigationPathItem;
        return key;
    }
    getOrderby(): string {
        let orderby: string = '';
        for (let i = 0; i < this.orderbyItems.length; i++) {
            if (orderby !== '')
                orderby += ','
            orderby += this.orderbyItems[i].property;
            if (this.orderbyItems[i].direction)
                orderby += ' desc';
        }
        return orderby;
    }
    getRoot(): EntitySetContext {
        let context: EntitySetContext = this;
        while (context.parent != null)
            context = context.parent;
        return context;
    }
    getSelect(): string {
        return this.isGroupby() ? '' : this.getSelectKind(SelectKind.Select);
    }
    getSelectExpressionByAlias(alias: string): SelectExpression | null {
        for (let i = 0; i < this.selectItems.length; i++)
            if (this.selectItems[i].alias === alias)
                return this.selectItems[i];

        for (let i = 0; i < this.groupbyItems.length; i++)
            if (this.groupbyItems[i].alias === alias)
                return this.groupbyItems[i];

        return null;
    }
    private getSelectKind(kind: SelectKind): string {
        let selected: string = '';
        for (let i = 0; i < this.selectItems.length; i++)
            if (this.selectItems[i].kind == kind) {
                if (selected !== '')
                    selected += ','
                selected += this.selectItems[i].expression;
                if (kind === SelectKind.Compute || kind === SelectKind.Aggregate)
                    selected += ' as ' + this.selectItems[i].alias;
            }
        return selected;
    }
    getSkip(): string {
        return isNaN(this.skipItem) ? '' : this.skipItem.toString();
    }
    getTop(): string {
        return isNaN(this.topItem) ? '' : this.topItem.toString();
    }
    isGroupby(): boolean {
        return this.groupbyItems.length > 0
    }
    setKey(key: any, navigationPath: string): void {
        if (this.expandItems.length > 0 ||
            this.filterItems.length > 0 ||
            this.groupbyItems.length > 0 ||
            this.orderbyItems.length > 0 ||
            this.selectItems.length > 0 ||
            !isNaN(this.skipItem) ||
            !isNaN(this.topItem))
            throw new Error('Key must be first');
        this.keyItem = key;
        this.navigationPathItem = navigationPath;
    }
    setSkip(count: number): void {
        this.skipItem = Math.trunc(count);
    }
    setTop(count: number): void {
        this.topItem = Math.trunc(count);
    }

    readonly baseUrl: string;
    readonly entitySet: string;
    readonly odataNamespace: string;
    readonly odataParser?: OdataParser;
}