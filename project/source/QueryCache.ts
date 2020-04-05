import { EntitySetContext } from './EntitySetContext';
import * as helpers from './helpers';
import * as types from './types';

class QueryCacheImpl {
    private readonly filterExpressions: Map<string, string>;
    private readonly propertyPaths: Map<string, string>;
    private readonly selectExpressions: Map<string, Array<types.SelectExpression>>;

    public constructor() {
        this.filterExpressions = new Map<string, string>();
        this.propertyPaths = new Map<string, string>();
        this.selectExpressions = new Map<string, Array<types.SelectExpression>>();
    }

    addFilterExpression(code: string, expression: string): void {
        this.filterExpressions.set(code, expression);
    }
    addPropertyPath(code: string, propertyPath: string): void {
        this.propertyPaths.set(code, propertyPath);
    }
    addSelectExpression(code: string, expression: Array<types.SelectExpression>): void {
        this.selectExpressions.set(code, expression);
    }
    getFilterExpression(code: string): string | undefined {
        return this.filterExpressions.get(code);
    }
    getPropertyPath(code: string): string | undefined {
        return this.propertyPaths.get(code);
    }
    getSelectExpression(code: string): Array<types.SelectExpression> | undefined {
        return this.selectExpressions.get(code);
    }
}

let queryCache: QueryCacheImpl;
let queryCacheFixEnum: QueryCacheImpl;

export function getQueryCache(entitySetContext?: EntitySetContext): QueryCacheImpl {
    if (!queryCache)
        queryCache = new QueryCacheImpl();
    if (!queryCacheFixEnum)
        queryCacheFixEnum = new QueryCacheImpl();

    return entitySetContext && helpers.isFixEnum(entitySetContext) ? queryCacheFixEnum : queryCache;
}