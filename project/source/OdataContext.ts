import { EntitySet } from './EntitySet';
import { OdataParser } from './OdataParser';
import { BabelTraverse } from './babel/traverse';
import { PluginTraverse } from './PluginTraverse';

export abstract class OdataContext<T extends OdataContext<T>>{
    public static create<T extends OdataContext<T>>(TCtor: new () => T, baseUrl: string, odataNamespace?: string, odataParser?: OdataParser): T {
        let context: T = new TCtor();
        for (const entitySet in context)
            Object.defineProperty(context, entitySet, {
                get() { return EntitySet.create<object>(new PluginTraverse(), baseUrl, entitySet, odataNamespace, odataParser); }
            });
        return context;
    }
}
