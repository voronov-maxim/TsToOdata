import { EntitySetContext } from './EntitySetContext';

export class SelectExpression {
    readonly alias: string
    readonly expression: string;
    readonly kind: SelectKind;

    constructor(expression: string, alias: string, kind: SelectKind) {
        this.expression = expression;
        this.alias = alias;
        this.kind = kind;
    }
}

export enum SelectKind {
    Select,
    Compute,
    Aggregate
}

export type Structural =
    | string
    | boolean
    | number
    | bigint
    | symbol
    | Date
    | Required<string>
    | Required<boolean>
    | Required<number>
    | Required<bigint>
    | Required<symbol>
    | Required<Date>;

export type NullableStructural = Structural | undefined;

export type Unpacked<T> = NonNullable<T extends Array<infer U> ? U : T>;

export type NestedRequired<T> = {
    [P in keyof Required<T>]: Required<T>[P] extends Array<infer U> ? Array<Required<U>> : Required<T>[P] extends object ? Required<T[P]> : T[P];
};
export type DeepRequired<T> = NestedRequired<Required<T>>;  

export interface IGrouping<TKey, TElement> {
    key: TKey;
    average(selector: (value: Required<TElement>) => number | undefined): number;
    count(): number;
    countdistinct(selector: (value: Required<TElement>) => NullableStructural): number;
    max(selector: (value: Required<TElement>) => NullableStructural): number;
    min(selector: (value: Required<TElement>) => NullableStructural): number;
    sum(selector: (value: Required<TElement>) => number | undefined): number;
}

export interface TraverseBase {
    traverseFilter(entitySetContext: EntitySetContext, code: Function, scope?: object): string;
    traversePropertyPath(code: Function): string;
    traverseSelect(entitySetContext: EntitySetContext, code: Function, scope?: object): Array<SelectExpression>;
}