export class OdataFunctions {
    static arrayLength(value: Array<any>): number {
        return value.length;
    }
    static stringLength(value: string | undefined): number {
        return value?.length ?? 0;
    } 
}