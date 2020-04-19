#### TsToOdata ####  
Typescript OData queries in a fluent way like linq.

#### How to install ####  
```
npm install ts2odata
npm install --save-dev babel-plugin-ts2odata
```
babel.config.js
```javascript
module.exports = {
    plugins: [
        [
            'babel-plugin-ts2odata',
            {
                odataNamespace: 'OdataToEntity.Test.Model'
            }
        ]
    ]
};
```
For odatanamespace option see Enumeration types section.

#### Create data model ####  
Create Json schema from OData EDMX.  
To do this, you can use the library [OdataToEntity](https://github.com/voronov-maxim/OdataToEntity/wiki/Json-schema).
```cs
IEdmModel edmModel;
using (var reader = XmlReader.Create("edmx_schema.xml"))
    edmModel = CsdlReader.Parse(reader);

var generator = new OeJsonSchemaGenerator(edmModel);
using (var utf8Json = new MemoryStream())
{
    generator.Generate(utf8Json);
    utf8Json.Position = 0;
    File.WriteAllBytes("json_schema.json", utf8Json.ToArray());
}
```
Create TypeScript classes from Json schema.
To do this, you can use the library [quicktype](https://github.com/quicktype/quicktype).  
The result is a [data model](https://raw.githubusercontent.com/voronov-maxim/TsToOdata/master/test/order.ts), which I will use in below mentioned examples.

#### Create data access context ####  
```javascript
import { EntitySet, OdataContext } from 'ts2odata';
import * as oe from './order';

export class OrderContext extends OdataContext<OrderContext> {
    Categories = EntitySet.default<oe.Category>();
    Customers = EntitySet.default<oe.Customer>();
    OrderItems = EntitySet.default<oe.OrderItem>();
    OrderItemsView = EntitySet.default<oe.OrderItemsView>();
    Orders = EntitySet.default<oe.Order>();
}
```
```javascript
let context: OrderContext = OdataContext.create(OrderContext, 'http://localhost:5000/api');
```

#### Query examples ####  
Get all entities
```javascript
context.Orders;
//http://localhost:5000/api/Orders
```
Selects a subset of properties
```javascript
context.Orders.select(o => { return { p: o.Name } });
//http://localhost:5000/api/Orders?$select=Name
```
Sort ascending
```javascript
context.Orders.orderby(i => i.Id);
//http://localhost:5000/api/Orders?$orderby=Id
```
Sort descending
```javascript
context.Orders.orderbyDescending(i => i.Id);
//http://localhost:5000/api/Orders?$orderby=Id desc
```
Filter expressions
```javascript
context.Orders.filter(o => o.Date.getFullYear() == 2016);
//http://localhost:5000/api/Orders?$filter=year(Date) eq 2016
```
Get related entities 
```javascript
context.Orders.expand(o => o.Items);
//http://localhost:5000/api/Orders?$expand=Items
```
Get related entities nested levels
```javascript
context.Customers.expand(c => c.Orders).thenExpand(o => o.Items);
//http://localhost:5000/api/Customers?$expand=Orders($expand=Items)
```
Skip a subset of the entities
```javascript
context.Orders.orderby(i => i.Id).skip(2);
//http://localhost:5000/api/Orders?$orderby=Id&$skip=2
```
Take a subset of the entities
```javascript
context.Orders.orderby(i => i.Id).top(3);
//http://localhost:5000/api/Orders?$orderby=Id&$top=3
```
Groups of entities
```javascript
context.OrderItems.groupby(i => { return { Product: i.Product } });
//localhost:5000/api/OrderItems?$apply=groupby((Product))
```
Aggregate functions
```javascript
context.OrderItems.groupby(i => { return { OrderId: i.OrderId, Status: i.Order.Status } })
    .select(g => {
        return {
            orderId: g.key.OrderId,
            avg: g.average(i => i.Price),
            dcnt: g.countdistinct(i => i.Product),
            max: g.max(i => i.Price),
            max_status: g.max(_ => g.key.Status),
            min: g.min(i => i.Price),
            sum: g.sum(i => i.Price),
            cnt: g.count()
        }});
//http://localhost:5000/api/OrderItems?$apply=groupby((OrderId,Order/Status),aggregate(Price with average as avg,Product with countdistinct as dcnt,Price with max as max,Order/Status with max as max_status,Price with min as min,Price with sum as sum,$count as cnt))
```
Get entity by key properties
```javascript
context.Customers.key({ Country: 'RU', Id: 1 });
//http://localhost:5000/api/Customers(Country='RU',Id=1)
```
Get entity by key properties to another related entity
```javascript
context.OrderItems.key(1, i => i.Order.Customer);
//http://localhost:5000/api/OrderItems(1)/Order/Customer
```
Compute properties
```javascript
context.OrderItems
    .select(i => {
        return {
            product: i.Product,
            Total: i.Count * i.Price,
            SumId: i.Id + i.OrderId
        }
    });
//http://localhost:5000/api/OrderItems?$select=Product&$compute=Count mul Price as Total,Id add OrderId as SumId
```
Lambda operators
```javascript
context.Orders.filter(o => o.Items.every(i => i.Price >= 2.1));
//http://localhost:5000/api/Orders?$filter=Items/all(d:d/Price ge 2.1)
```
```javascript
context.Orders.filter(o => o.Items.some(i => i.Count > 2));
//http://localhost:5000/api/Orders?$filter=Items/any(d:d/Count gt 2)
```
IN operator
```javascript
let items = [1.1, 1.2, 1.3];
context.OrderItems.filter(i => items.includes(i.Price), { items: items });
//http://localhost:5000/api/OrderItems?$filter=Price in (1.1,1.2,1.3)
```
Count of entities
```javascript
context.Orders.count();
//http://localhost:5000/api/Orders/$count
```
Revert context to entity set  
Apply *asEntitySet* method when must to sort by properties missing in the selection set
```javascript
context.Orders(o => o.AltCustomer).thenSelect(o => {{
    p1: o.Address,
    : o.Country,
    : o.Id,
    : o.Name,
    : o.Sex
}}).asEntitySet().orderby(o => o.Id)
//http://localhost:5000/api/Orders?$expand=AltCustomer($select=Address,Country,Id,Name,Sex)&$orderby=Id
```
Other examples are on the [GitHub](https://github.com/voronov-maxim/TsToOdata/blob/master/test/QueryTests.ts).

It should be noted that the methods *select*, *expand*, *groupby* change context, their result is a new type and to continue execution in this new context, you need to use methods with prefix *then*: *thenFilter*, *thenExpand*, *thenOrderby*, *thenOrderbyDescending*, *thenSkip*, *thenTop*. The *select* and *thenSelect* methods irreversibly change the context, and to continue execution in parent context, you need to use the *asEntitySet* method.

#### Parameterized query ####  
*filter/thenFilter*,*select/thenSelect*, *groupby* methods can be parameterized, the names of the properties of the parameterization object must match the names of the variables in the query.
```javascript
let count: number | null = null;
context.OrderItems.filter(i => i.Count == count, { count: count });  
//http://localhost:5000/api/OrderItems?$filter=Count eq null
```
```javascript
let s = {
    altCustomerId: 3,
    customerId: 4,
    dateYear: 2016,
    dateMonth: 11,
    dateDay: 20,
    date: null,
    name: 'unknown',
    status: "OdataToEntity.Test.Model.OrderStatus'Unknown'",
    count1: 0,
    count2: null,
    price1: 0,
    price2: null,
    product1: 'unknown',
    product2: 'null',
    orderId: -1,
    id: 1
};
context.Orders.filter(o => o.AltCustomerId == s.altCustomerId &&
	o.CustomerId == s.customerId &&
	(o.Date.getFullYear() == s.dateYear &&
		o.Date.getMonth() > s.dateMonth &&
		o.Date.getDay() < s.dateDay ||
		o.Date == s.date) &&
	o.Name.includes(s.name) &&
	o.Status == s.status, s)
	.expand(o => o.Items)
		.thenFilter(i => (i.Count == s.count1 ||
				i.Count == s.count2) &&
			(i.Price == s.price1 ||
				i.Price == s.price2) &&
			(i.Product.includes(s.product1) ||
				i.Product.includes(s.product2)) &&
			i.OrderId > s.orderId &&
			i.Id != s.id, s);
/*http://localhost:5000/api/Orders?$filter=AltCustomerId eq 3 and
	CustomerId eq 4 and
	(year(Date) eq 2016 and
		month(Date) gt 11 and
		day(Date) lt 20 or
		Date eq null) and
	contains(Name,'unknown') and
	Status eq OdataToEntity.Test.Model.OrderStatus'Unknown'&
	$expand=Items(
		$filter=(Count eq 0 or
			Count eq null) and
		(Price eq 0 or
			Price eq null) and
		(contains(Product,'unknown') or
			contains(Product,'null')) and
		OrderId gt -1 and
		Id ne 1)*/
```
#### Functions mapping ####  
| JavaScript    |  OData     |
|---------------|------------|
| Math.ceil      | ceiling     |
| concat          | concat    |
| includes       | contains  |
| getDay         | day         |
| endsWith     | endswith  |
| Math.floor    | floor        |
| getHours      | hour       |
| indexOf        | indexof    |
| stringLength | length     |
| getMinutes   | minute    |
| getMonth     | month     |
| Math.round  | round      |
| getSeconds  | second     |
| startsWith    | startswith |
| substring     | substring  |
| toLowerCase | tolower   |
| toUpperCase | toupper   |
| trim             | trim        |
| getFullYear   | year        |

To get the length of the string, you should use *OdataFunctions.stringLength*
```javascript
context.Customers.filter(c => OdataFunctions.stringLength(c.Name) == 5);  
//http://localhost:5000/api/Customers?$filter=length(Name) eq 5
```
To get the length of the array, you should use*OdataFunctions.arrayLength*
```javascript
context.Orders.filter(o => OdataFunctions.arrayLength(o.Items) > 2);  
//http://localhost:5000/api/Customers?$filter=Items/$count gt 2
```

#### Get URL and execute query ####  
Query definition methods such as *select*, *filter* and other must be ended *getQueryUrl* or *toArrayAsync*.
*getQueryUrl* return URL. Executing this TypeScript code:
```javascript
let url: URL = context.Customers
    .expand(c => c.AltOrders).thenExpand(o => o.Items).thenOrderby(i => i.Price)
    .expand(c => c.AltOrders).thenExpand(o => o.ShippingAddresses).thenOrderby(s => s.Id)
    .expand(c => c.Orders).thenExpand(o => o.Items).thenOrderby(i => i.Price)
    .expand(c => c.Orders).thenExpand(o => o.ShippingAddresses).thenOrderby(s => s.Id)
    .orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
```
return OData query:
```
http://localhost:5000/api/Customers?$expand=
AltOrders($expand=Items($orderby=Price),ShippingAddresses($orderby=Id)),
Orders($expand=Items($orderby=Price),ShippingAddresses($orderby=Id))
&$orderby=Country,Id
```
*toArrayAsync* returns query result as Json. Executing this TypeScript code:
```javascript
context.Customers
    .expand(c => c.Orders).thenSelect(o => { return { Date: o.Date } }).orderby(o => o.Date)
    .asEntitySet().select(c => { return { Name: c.Name } }).orderby(c => c.Name).toArrayAsync();
```
return Json:
```json
[{
		"Name": "Ivan",
		"Orders": [{
				"Date": "2016-07-04T19:10:10.8237573+03:00"
			}, {
				"Date": "2020-02-20T20:20:20.000002+03:00"
			}
		]
	}, {
		"Name": "Natasha",
		"Orders": [{
				"Date": "2016-07-04T19:10:11+03:00"
			}
		]
	}, {
		"Name": "Sasha",
		"Orders": []
	}, {
		"Name": "Unknown",
		"Orders": [{
				"Date": null
			}
		]
	}
]
```
If you want to get the property as a date, not a string, you can call *toArrayAsync* with an optional parameter *OdataParser*:
```javascript
import { OdataParser } from 'ts2odata';
import schema from './schema.json';

let odataParser = new OdataParser(schema);
context.Orders.toArrayAsync(odataParser);
```

#### Enumeration types ####  
If your OData service does not support enumeration without a Namespace, for proper code translation it is necessary to pass  Namespace value to the method of creating a data context:
```javascript
let context: OrderContext = OdataContext.create(OrderContext, 'http://localhost:5000/api', 'OdataToEntity.Test.Model');
```
In some cases, for the correct translation of enumeration types, it may be necessary to create an object *OdataParser*.
```javascript
import { OdataParser } from 'ts2odata';
import schema from './schema.json';

let odataParser = new OdataParser(schema);
let context: OrderContext = OdataContext.create(OrderContext, 'http://localhost:5000/api', 'OdataToEntity.Test.Model', odataParser);
```
