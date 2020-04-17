import { EntitySetContext } from 'ts2odata';
import { SelectExpression, TraverseBase } from 'ts2odata';
export declare class Traverse implements TraverseBase {
    traverseFilter(entitySetContext: EntitySetContext, code: string, scope?: object): string;
    traversePropertyPath(code: string): string;
    traverseSelect(entitySetContext: EntitySetContext, code: string, scope?: object): Array<SelectExpression>;
}
