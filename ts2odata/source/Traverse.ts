import { EntitySetContext } from './EntitySetContext';
import * as helpers from './helpers';
import { SelectExpression, TraverseBase } from './types';

export class Traverse implements TraverseBase {
    traverseFilter(entitySetContext: EntitySetContext, code: string, scope?: object): string {
        return scope === undefined ? code : helpers.fillParameters(code, scope, entitySetContext);
    }
    traversePropertyPath(code: string): string {
        return code;
    }
    traverseSelect(entitySetContext: EntitySetContext, code: string, scope?: object): Array<SelectExpression> {
        let expression: Array<SelectExpression> = getSelectExpressionsFromJson(code);
        return scope === undefined ? expression : helpers.fillSelectParameters(expression, scope, entitySetContext);
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