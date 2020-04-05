import { EntitySet } from './EntitySet';
import { OdataParser } from './OdataParser';
import { BabelTraverse } from './babel/traverse';
import { CacheTraverse } from './CacheTraverse';

export abstract class OdataContext<T extends OdataContext<T>>{
    public static create<T extends OdataContext<T>>(TCtor: new () => T, baseUrl: string, odataNamespace?: string, odataParser?: OdataParser): T {
        let context: T = new TCtor();
        for (const entitySet in context)
            Object.defineProperty(context, entitySet, {
                get() { return EntitySet.create<object>(new BabelTraverse(), baseUrl, entitySet, odataNamespace, odataParser); }
            });
        return context;
    }
}
