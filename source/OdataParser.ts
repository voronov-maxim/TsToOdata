export class OdataParser {
    readonly enitites: any;

    constructor(schema: any) {
        this.enitites = OdataParser.CreateEnitites(schema);
    }

    private static CreateEnitites(schema: any): Map<string, object> {
        let entitySets: any = OdataParser.GetEnitytSets(schema);

        let entities = new Map<string, object>();
        let definitions: any = schema['definitions'];
        let entityNames: Array<string> = Object.getOwnPropertyNames(definitions);
        entityNames.forEach(e => {
            let properties: any = definitions[e].properties;
            if (properties) {
                let propertyNames: Array<string> = Object.getOwnPropertyNames(properties);
                let entitySetName: string = entitySets[e];
                let entity: any = entities.get(entitySetName);
                if (!entity) {
                    entity = {};
                    entities.set(entitySetName, entity);
                }

                propertyNames.forEach(p => {
                    if (properties[p].format == 'date-time') {
                        entity[p] = (value: string) => value == null ? null : new Date(value);
                    }
                });
            }
        });
        return entities;
    }

    private static GetEnitytSets(schema: any): object {
        const refDef: string = '#/definitions/';

        let entitySets: any = {};
        let properties: any = schema['properties'];
        let entitySetNames: Array<string> = Object.getOwnPropertyNames(properties);
        entitySetNames.forEach(e => {
            let entitySet: any = properties[e];
            if (entitySet.items && entitySet.items.$ref) {
                let ref = entitySet.items.$ref as string;
                if (ref.startsWith(refDef))
                    entitySets[ref.substring(refDef.length)] = e;
            }
        });
        return entitySets;
    }

    static parse(text: string): Array<object> {
        let value: object;
        return JSON.parse(text, (k, v) => {
            if (k == '@odata.context')
                return undefined;
            if (k == 'value') {
                value = v;
                return undefined;
            }
            return k == '' ? value : v;
        });
    }
    parseEntitySet(text: string, entitySetName: string): Array<object> {
        let entity: any = this.enitites[entitySetName];
        let value: object;
        if (entity)
            return JSON.parse(text, (k, v) => {
                if (k == '@odata.context')
                    return undefined;
                if (k == 'value') {
                    value = v;
                    return undefined;
                }
                if (k == '')
                    return value;

                let converter: (value: string) => any = entity[k];
                return converter ? converter(v) : v;
            });

        return JSON.parse(text);
    }
}