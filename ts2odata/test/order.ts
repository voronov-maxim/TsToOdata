// To parse this data:
//
//   import { Convert, Test } from "./file";
//
//   const test = Convert.toTest(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Test {
    Categories?:              Category[];
    Customers?:               Customer[];
    CustomerShippingAddress?: CustomerShippingAddress[];
    ManyColumns?:             ManyColumns[];
    ManyColumnsView?:         ManyColumnsView[];
    OrderItems?:              OrderItem[];
    OrderItemsView?:          OrderItemsView[];
    Orders?:                  Order[];
    ShippingAddresses?:       ShippingAddress[];
}

export interface Category {
    Children?: Category[];
    DateTime?: Date;
    Id:        number;
    Name:      string;
    Parent?:   Category;
    ParentId?: number;
}

export interface ShippingAddress {
    Address:                    string;
    Customers?:                 Customer[];
    CustomerShippingAddresses?: CustomerShippingAddress[];
    Id:                         number;
    OrderId:                    number;
}

export interface OrderItem {
    Count?:  number;
    Id:      number;
    Order?:  Order;
    OrderId: number;
    Price?:  number;
    Product: string;
}

export interface Order {
    AltCustomer?:        Customer;
    AltCustomerCountry?: string;
    AltCustomerId?:      number;
    Customer?:           Customer;
    CustomerCountry:     string;
    CustomerId:          number;
    Date?:               Date;
    Id:                  number;
    Items?:              OrderItem[];
    Name:                string;
    ShippingAddresses?:  ShippingAddress[];
    Status:              OrderStatus;
}

export interface Customer {
    Address?:                   string;
    AltOrders?:                 Order[];
    Country:                    string;
    CustomerShippingAddresses?: CustomerShippingAddress[];
    Id:                         number;
    Name:                       string;
    Orders?:                    Order[];
    Sex?:                       Sex;
    ShippingAddresses?:         ShippingAddress[];
}

export interface CustomerShippingAddress {
    Customer?:              Customer;
    CustomerCountry:        string;
    CustomerId:             number;
    ShippingAddress?:       ShippingAddress;
    ShippingAddressId:      number;
    ShippingAddressOrderId: number;
}

export enum OrderStatus {
    Cancelled = "Cancelled",
    Delivering = "Delivering",
    Processing = "Processing",
    Shipped = "Shipped",
    Unknown = "Unknown",
}

export enum Sex {
    Female = "Female",
    Male = "Male",
}

export interface ManyColumns {
    Column01: number;
    Column02: number;
    Column03: number;
    Column04: number;
    Column05: number;
    Column06: number;
    Column07: number;
    Column08: number;
    Column09: number;
    Column10: number;
    Column11: number;
    Column12: number;
    Column13: number;
    Column14: number;
    Column15: number;
    Column16: number;
    Column17: number;
    Column18: number;
    Column19: number;
    Column20: number;
    Column21: number;
    Column22: number;
    Column23: number;
    Column24: number;
    Column25: number;
    Column26: number;
    Column27: number;
    Column28: number;
    Column29: number;
    Column30: number;
}

export interface ManyColumnsView {
    Column01: number;
    Column02: number;
    Column03: number;
    Column04: number;
    Column05: number;
    Column06: number;
    Column07: number;
    Column08: number;
    Column09: number;
    Column10: number;
    Column11: number;
    Column12: number;
    Column13: number;
    Column14: number;
    Column15: number;
    Column16: number;
    Column17: number;
    Column18: number;
    Column19: number;
    Column20: number;
    Column21: number;
    Column22: number;
    Column23: number;
    Column24: number;
    Column25: number;
    Column26: number;
    Column27: number;
    Column28: number;
    Column29: number;
    Column30: number;
}

export interface OrderItemsView {
    Name:    string;
    Product: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toTest(json: string): Test {
        return cast(JSON.parse(json), r("Order"));
    }

    public static testToJson(value: Test): string {
        return JSON.stringify(uncast(value, r("Test")), null, 2);
    }
}

function invalidValue(typ: any, val: any): never {
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        var map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        var map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        if (typ === undefined && val === null) return val;
        return invalidValue(typ, val);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        var l = typs.length;
        for (var i = 0; i < l; i++) {
            var typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return cases[val];
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(typ: any, val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        var result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps);
        });
        //Object.getOwnPropertyNames(val).forEach(key => {
        //    if (!Object.prototype.hasOwnProperty.call(props, key)) {
        //        result[key] = transform(val[key], additional, getProps);
        //    }
        //});
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(typ, val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Test": o([
        { json: "Categories", js: "Categories", typ: u(undefined, a(r("Category"))) },
        { json: "Customers", js: "Customers", typ: u(undefined, a(r("Customer"))) },
        { json: "CustomerShippingAddress", js: "CustomerShippingAddress", typ: u(undefined, a(r("CustomerShippingAddress"))) },
        { json: "ManyColumns", js: "ManyColumns", typ: u(undefined, a(r("ManyColumns"))) },
        { json: "ManyColumnsView", js: "ManyColumnsView", typ: u(undefined, a(r("ManyColumnsView"))) },
        { json: "OrderItems", js: "OrderItems", typ: u(undefined, a(r("OrderItem"))) },
        { json: "OrderItemsView", js: "OrderItemsView", typ: u(undefined, a(r("OrderItemsView"))) },
        { json: "Orders", js: "Orders", typ: u(undefined, a(r("Order"))) },
        { json: "ShippingAddresses", js: "ShippingAddresses", typ: u(undefined, a(r("ShippingAddress"))) },
    ], "any"),
    "Category": o([
        { json: "Children", js: "Children", typ: u(undefined, a(r("Category"))) },
        { json: "DateTime", js: "DateTime", typ: u(undefined, Date) },
        { json: "Id", js: "Id", typ: 0 },
        { json: "Name", js: "Name", typ: "" },
        { json: "Parent", js: "Parent", typ: u(undefined, r("Category")) },
        { json: "ParentId", js: "ParentId", typ: u(undefined, 0) },
    ], false),
    "ShippingAddress": o([
        { json: "Address", js: "Address", typ: "" },
        { json: "Customers", js: "Customers", typ: u(undefined, a(r("Customer"))) },
        { json: "CustomerShippingAddresses", js: "CustomerShippingAddresses", typ: u(undefined, a(r("CustomerShippingAddress"))) },
        { json: "Id", js: "Id", typ: 0 },
        { json: "OrderId", js: "OrderId", typ: 0 },
    ], false),
    "OrderItem": o([
        { json: "Count", js: "Count", typ: u(undefined, 0) },
        { json: "Id", js: "Id", typ: 0 },
        { json: "Order", js: "Order", typ: u(undefined, r("Order")) },
        { json: "OrderId", js: "OrderId", typ: 0 },
        { json: "Price", js: "Price", typ: u(undefined, 3.14) },
        { json: "Product", js: "Product", typ: "" },
    ], false),
    "Order": o([
        { json: "AltCustomer", js: "AltCustomer", typ: u(undefined, r("Customer")) },
        { json: "AltCustomerCountry", js: "AltCustomerCountry", typ: u(undefined, "") },
        { json: "AltCustomerId", js: "AltCustomerId", typ: u(undefined, 0) },
        { json: "Customer", js: "Customer", typ: u(undefined, r("Customer")) },
        { json: "CustomerCountry", js: "CustomerCountry", typ: "" },
        { json: "CustomerId", js: "CustomerId", typ: 0 },
        { json: "Date", js: "Date", typ: Date },
        { json: "Id", js: "Id", typ: 0 },
        { json: "Items", js: "Items", typ: u(undefined, a(r("OrderItem"))) },
        { json: "Name", js: "Name", typ: "" },
        { json: "ShippingAddresses", js: "ShippingAddresses", typ: u(undefined, a(r("ShippingAddress"))) },
        { json: "Status", js: "Status", typ: r("OrderStatus") },
    ], false),
    "Customer": o([
        { json: "Address", js: "Address", typ: u(undefined, "") },
        { json: "AltOrders", js: "AltOrders", typ: u(undefined, a(r("Order"))) },
        { json: "Country", js: "Country", typ: "" },
        { json: "CustomerShippingAddresses", js: "CustomerShippingAddresses", typ: u(undefined, a(r("CustomerShippingAddress"))) },
        { json: "Id", js: "Id", typ: 0 },
        { json: "Name", js: "Name", typ: "" },
        { json: "Orders", js: "Orders", typ: u(undefined, a(r("Order"))) },
        { json: "Sex", js: "Sex", typ: u(undefined, r("Sex")) },
        { json: "ShippingAddresses", js: "ShippingAddresses", typ: u(undefined, a(r("ShippingAddress"))) },
    ], false),
    "CustomerShippingAddress": o([
        { json: "Customer", js: "Customer", typ: u(undefined, r("Customer")) },
        { json: "CustomerCountry", js: "CustomerCountry", typ: "" },
        { json: "CustomerId", js: "CustomerId", typ: 0 },
        { json: "ShippingAddress", js: "ShippingAddress", typ: u(undefined, r("ShippingAddress")) },
        { json: "ShippingAddressId", js: "ShippingAddressId", typ: 0 },
        { json: "ShippingAddressOrderId", js: "ShippingAddressOrderId", typ: 0 },
    ], false),
    "ManyColumns": o([
        { json: "Column01", js: "Column01", typ: 0 },
        { json: "Column02", js: "Column02", typ: 0 },
        { json: "Column03", js: "Column03", typ: 0 },
        { json: "Column04", js: "Column04", typ: 0 },
        { json: "Column05", js: "Column05", typ: 0 },
        { json: "Column06", js: "Column06", typ: 0 },
        { json: "Column07", js: "Column07", typ: 0 },
        { json: "Column08", js: "Column08", typ: 0 },
        { json: "Column09", js: "Column09", typ: 0 },
        { json: "Column10", js: "Column10", typ: 0 },
        { json: "Column11", js: "Column11", typ: 0 },
        { json: "Column12", js: "Column12", typ: 0 },
        { json: "Column13", js: "Column13", typ: 0 },
        { json: "Column14", js: "Column14", typ: 0 },
        { json: "Column15", js: "Column15", typ: 0 },
        { json: "Column16", js: "Column16", typ: 0 },
        { json: "Column17", js: "Column17", typ: 0 },
        { json: "Column18", js: "Column18", typ: 0 },
        { json: "Column19", js: "Column19", typ: 0 },
        { json: "Column20", js: "Column20", typ: 0 },
        { json: "Column21", js: "Column21", typ: 0 },
        { json: "Column22", js: "Column22", typ: 0 },
        { json: "Column23", js: "Column23", typ: 0 },
        { json: "Column24", js: "Column24", typ: 0 },
        { json: "Column25", js: "Column25", typ: 0 },
        { json: "Column26", js: "Column26", typ: 0 },
        { json: "Column27", js: "Column27", typ: 0 },
        { json: "Column28", js: "Column28", typ: 0 },
        { json: "Column29", js: "Column29", typ: 0 },
        { json: "Column30", js: "Column30", typ: 0 },
    ], false),
    "ManyColumnsView": o([
        { json: "Column01", js: "Column01", typ: 0 },
        { json: "Column02", js: "Column02", typ: 0 },
        { json: "Column03", js: "Column03", typ: 0 },
        { json: "Column04", js: "Column04", typ: 0 },
        { json: "Column05", js: "Column05", typ: 0 },
        { json: "Column06", js: "Column06", typ: 0 },
        { json: "Column07", js: "Column07", typ: 0 },
        { json: "Column08", js: "Column08", typ: 0 },
        { json: "Column09", js: "Column09", typ: 0 },
        { json: "Column10", js: "Column10", typ: 0 },
        { json: "Column11", js: "Column11", typ: 0 },
        { json: "Column12", js: "Column12", typ: 0 },
        { json: "Column13", js: "Column13", typ: 0 },
        { json: "Column14", js: "Column14", typ: 0 },
        { json: "Column15", js: "Column15", typ: 0 },
        { json: "Column16", js: "Column16", typ: 0 },
        { json: "Column17", js: "Column17", typ: 0 },
        { json: "Column18", js: "Column18", typ: 0 },
        { json: "Column19", js: "Column19", typ: 0 },
        { json: "Column20", js: "Column20", typ: 0 },
        { json: "Column21", js: "Column21", typ: 0 },
        { json: "Column22", js: "Column22", typ: 0 },
        { json: "Column23", js: "Column23", typ: 0 },
        { json: "Column24", js: "Column24", typ: 0 },
        { json: "Column25", js: "Column25", typ: 0 },
        { json: "Column26", js: "Column26", typ: 0 },
        { json: "Column27", js: "Column27", typ: 0 },
        { json: "Column28", js: "Column28", typ: 0 },
        { json: "Column29", js: "Column29", typ: 0 },
        { json: "Column30", js: "Column30", typ: 0 },
    ], false),
    "OrderItemsView": o([
        { json: "Name", js: "Name", typ: "" },
        { json: "Product", js: "Product", typ: "" },
    ], false),
    "OrderStatus": [
        "Cancelled",
        "Delivering",
        "Processing",
        "Shipped",
        "Unknown",
    ],
    "Sex": [
        "Female",
        "Male",
    ],
};
