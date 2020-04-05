export class EntityDefinition {
    readonly entityName: string;
    readonly entitySetName: string;
    readonly properties: Map<string, PropertyDefinition>;

    constructor(entityName: string, entitySetName: string) {
        this.entityName = entityName;
        this.entitySetName = entitySetName;
        this.properties = new Map<string, PropertyDefinition>();
    }
}

export class PropertyDefinition {
    readonly converter?: (value: any) => any;
    readonly name: string;
    readonly isEnum: boolean;
    readonly propertyType: EntityDefinition | string;

    constructor(name: string, propertyType: EntityDefinition | string, isEnum: boolean, converter?: (value: any) => any) {
        this.name = name;
        this.propertyType = propertyType;
        this.isEnum = isEnum;
        this.converter = converter;
    }
}

export class OdataParser {
    readonly enitites: Map<string, EntityDefinition>;

    constructor(schema: any) {
        this.enitites = OdataParser.createEnitites(schema);
    }

    private static createEnitites(schema: any): Map<string, EntityDefinition> {
        let definitions: any = schema.definitions;
        let entitySets: Map<string, string> = OdataParser.getEntitySets(schema);

        let entities = new Map<string, EntityDefinition>();
        let enums = new Set<string>();
        for (let entityName in definitions)
            if (definitions[entityName].properties) {
                let entitySetName: string | undefined = entitySets.get(entityName);
                if (entitySetName) {
                    let entityDef: EntityDefinition | undefined = entities.get(entitySetName);
                    if (!entityDef) {
                        entityDef = new EntityDefinition(entityName, entitySetName);
                        entities.set(entitySetName, entityDef);
                    }
                }
            }
            else if (definitions[entityName].enum)
                enums.add(entityName);
            else
                throw Error('Unknown entity type in json schema');


        for (let entityName in definitions) {
            let entitySetName: string | undefined = entitySets.get(entityName);
            if (entitySetName) {
                let entityDef: EntityDefinition = entities.get(entitySetName) as EntityDefinition;
                let properties: any = definitions[entityName].properties;
                for (let propertyName in properties) {
                    let converter: ((value: any) => any) | undefined;
                    let isEnum: boolean = false;
                    let property: any = properties[propertyName];
                    let propertyType: EntityDefinition | string;
                    if (property.items) {
                        let entityName: string = this.getEntityNameFromDefinition(property.items) as string;
                        let propertyEntitySetName = entitySets.get(entityName) as string;
                        propertyType = entities.get(propertyEntitySetName) as EntityDefinition;
                    }
                    else if (property.$ref) {
                        let entityName = this.getEntityNameFromDefinition(property) as string;
                        let propertyEntitySetName = entitySets.get(entityName) as string;
                        isEnum = enums.has(entityName);
                        propertyType = isEnum ? entityName : entities.get(propertyEntitySetName) as EntityDefinition;
                    }
                    else {
                        propertyType = property.type;
                        if (property.format == 'date-time')
                            converter = (value: string) => value == null ? null : new Date(value);
                    }

                    let propertyDef = new PropertyDefinition(propertyName, propertyType, isEnum, converter);
                    entityDef.properties.set(propertyName, propertyDef);
                }
            }
        }

        return entities;
    }
    private static getEntityNameFromDefinition(node: any): string | undefined {
        const refDef: string = '#/definitions/';
        if (node.$ref) {
            let ref = node.$ref as string;
            if (ref.startsWith(refDef))
                return ref.substring(refDef.length);
        }
        return undefined;
    }
    private static getEntitySets(schema: any): Map<string, string> {
        let entitySets = new Map<string, string>();
        let properties: any = schema.properties;
        for (let entitySetName in properties) {
            let entitySet: any = properties[entitySetName];
            if (entitySet.items && entitySet.items.$ref) {
                let entityName: string | undefined = this.getEntityNameFromDefinition(entitySet.items);
                if (entityName)
                    entitySets.set(entityName, entitySetName);
            }
        }
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
        let entity: EntityDefinition = this.enitites[entitySetName];
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

                let propertyDef = entity.properties.get(k) as PropertyDefinition;
                return propertyDef.converter ? propertyDef.converter(v) : v;
            });

        return JSON.parse(text);
    }
}