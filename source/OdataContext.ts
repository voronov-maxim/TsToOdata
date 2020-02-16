import { EntitySet } from './EntitySet';

export abstract class OdataContext<T extends OdataContext<T>>{
    public static create<T extends OdataContext<T>>(TCtor: new () => T, baseUrl: string, odataNamespace?: string): T {
        let context: T = new TCtor();
        for (const entitySet in context)
            Object.defineProperty(context, entitySet, {
                get() { return EntitySet.create<object>(baseUrl, entitySet, odataNamespace); }
            });
        return context;
    }
}
