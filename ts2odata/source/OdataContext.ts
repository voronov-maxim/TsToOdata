import { EntitySet } from './EntitySet';
import { OdataParser } from './OdataParser';
import { PluginTraverse } from './PluginTraverse';
import { Traverse } from './types';

export abstract class OdataContext<T extends OdataContext<T>>{
    constructor(traverse?: Traverse) {
        this.traverse = traverse ?? new PluginTraverse();
    }

    public static create<T extends OdataContext<T>>(ctor: (new () => T) | (() => T), baseUrl: string, odataNamespace?: string, odataParser?: OdataParser): T {
        let context: T = ctor.prototype && ctor.prototype.constructor === ctor ? new (ctor as new () => T) : (ctor as () => T)();
        let traverse: Traverse = context.traverse;
        for (const entitySet in context)
            Object.defineProperty(context, entitySet, {
                get() { return EntitySet.create<object>(traverse, baseUrl, entitySet, odataNamespace, odataParser); }
            });
        return context;
    }

    readonly traverse: Traverse;
}
