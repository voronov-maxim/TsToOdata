import { EntitySet } from './EntitySet';
import { OdataParser } from './OdataParser';
import { Traverse } from './Traverse';
import { TraverseBase } from './types';

export abstract class OdataContext<T extends OdataContext<T>>{
    constructor(traverse?: TraverseBase) {
        this.traverse = traverse ?? new Traverse();
    }

    public static create<T extends OdataContext<T>>(ctor: (new () => T) | (() => T), baseUrl: string, odataNamespace?: string, odataParser?: OdataParser): T {
        let context: T = ctor.prototype && ctor.prototype.constructor === ctor ? new (ctor as new () => T) : (ctor as () => T)();
        let traverse: TraverseBase = context.traverse;
        for (const entitySet in context)
            Object.defineProperty(context, entitySet, {
                get() { return EntitySet.create<object>(traverse, baseUrl, entitySet, odataNamespace, odataParser); }
            });
        return context;
    }

    readonly traverse: TraverseBase;
}
