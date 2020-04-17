import { EntitySetContext } from './EntitySetContext';
import * as helpers from './helpers';
import { SelectExpression, TraverseBase } from './types';

export class Traverse implements TraverseBase {
    private babelTraverse: TraverseBase | undefined;

    private getBabelTraverse(): TraverseBase {
        if (!this.babelTraverse)
            this.babelTraverse = new (require('ts2odata-babel')).Traverse();
        return this.babelTraverse as TraverseBase;
    }
    traverseFilter(entitySetContext: EntitySetContext, code: Function, scope?: object): string {
        let param: any = code;
        if (typeof param === 'string')
            return scope === undefined ? param : helpers.fillParameters(param, scope, entitySetContext);

        if (param instanceof Function)
            return this.getBabelTraverse().traverseFilter(entitySetContext, code, scope);

        throw new Error('Invalid parameter code type ' + typeof param);
    }
    traversePropertyPath(code: Function): string {
        let param: any = code;
        if (typeof param === 'string')
            return param;

        if (param instanceof Function)
            return this.getBabelTraverse().traversePropertyPath(code);

        throw new Error('Invalid parameter code type ' + typeof param);
    }
    traverseSelect(entitySetContext: EntitySetContext, code: Function, scope?: object): Array<SelectExpression> {
        let param: any = code;
        if (typeof param === 'string') {
            let expression: Array<SelectExpression> = getSelectExpressionsFromJson(code.toString());
            return scope === undefined ? expression : helpers.fillSelectParameters(expression, scope, entitySetContext);
        }

        if (param instanceof Function)
            return this.getBabelTraverse().traverseSelect(entitySetContext, code, scope);

        throw new Error('Invalid parameter code type ' + typeof param);
    }
}

function getSelectExpressionsFromJson(json: string): Array<SelectExpression> {
    let selectExpressions = new Array<SelectExpression>();
    let items = JSON.parse(json) as Array<any>;
    for (let i = 0; i < items.length; i++) {
        let expression = new SelectExpression(items[i].expression, items[i].alias, items[i].kind);
        selectExpressions.push(expression);
    }
    return selectExpressions;
}