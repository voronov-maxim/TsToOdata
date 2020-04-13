"use strict";
var __importStar = this && this.__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  result["default"] = mod;
  return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var cross_fetch_1 = require("cross-fetch");
var OdataContext_1 = require("../../../../ts2odata/source/OdataContext");
var OdataFunctions_1 = require("../../../../ts2odata/source/OdataFunctions");
var oe = __importStar(require("../../../../ts2odata/test/order"));
var OrderContext_1 = require("../../../../ts2odata/test/OrderContext");
var QueryTests = /** @class */function () {
  function QueryTests(traverse, baseUri, odataParser) {
    this.odataNamespace = 'OdataToEntity.Test.Model';
    this.baseUri = baseUri;
    this.context = OdataContext_1.OdataContext.create(function () {return new OrderContext_1.OrderContext(traverse);}, baseUri, this.odataNamespace, odataParser);
  }
  QueryTests.prototype.applyFilter = function () {
    //not applicable
  };
  QueryTests.prototype.applyFilterGroupBy = function () {
    var url = this.context.Orders.filter("Status eq OdataToEntity.Test.Model.OrderStatus'Unknown'").
    groupby("[{\"expression\":\"Name\",\"alias\":\"Name\",\"kind\":0}]").select("[{\"expression\":\"Id with countdistinct\",\"alias\":\"cnt\",\"kind\":2}]").



    getQueryUrl();
    this.equal("Orders?$apply=filter(Status eq OdataToEntity.Test.Model.OrderStatus'Unknown')/groupby((Name),aggregate(Id with countdistinct as cnt))", url);
    var scope = { orderStatus: this.odataNamespace + '.OrderStatus' + "'" + oe.OrderStatus.Unknown + "'" };
    var url2 = this.context.Orders.filter("Status eq {orderStatus}", scope).
    groupby("[{\"expression\":\"Name\",\"alias\":\"Name\",\"kind\":0}]").select("[{\"expression\":\"Id with countdistinct\",\"alias\":\"cnt\",\"kind\":2}]").



    getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.applyGroupBy = function () {
    var url = this.context.OrderItems.groupby("[{\"expression\":\"Product\",\"alias\":\"Product\",\"kind\":0}]").orderby("key/Product").getQueryUrl();
    this.equal('OrderItems?$apply=groupby((Product))&$orderby=Product', url);
  };
  QueryTests.prototype.applyGroupByAggregate = function () {
    var url = this.context.OrderItems.groupby("[{\"expression\":\"OrderId\",\"alias\":\"OrderId\",\"kind\":0},{\"expression\":\"Order/Status\",\"alias\":\"Status\",\"kind\":0}]").
    select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Price with average\",\"alias\":\"avg\",\"kind\":2},{\"expression\":\"Product with countdistinct\",\"alias\":\"dcnt\",\"kind\":2},{\"expression\":\"Price with max\",\"alias\":\"max\",\"kind\":2},{\"expression\":\"Order/Status with max\",\"alias\":\"max_status\",\"kind\":2},{\"expression\":\"Price with min\",\"alias\":\"min\",\"kind\":2},{\"expression\":\"Price with sum\",\"alias\":\"sum\",\"kind\":2},{\"expression\":\"$count\",\"alias\":\"cnt\",\"kind\":2}]").










    orderby("orderId").getQueryUrl();
    this.equal('OrderItems?$apply=groupby((OrderId,Order/Status),aggregate(Price with average as avg,Product with countdistinct as dcnt,Price with max as max,Order/Status with max as max_status,Price with min as min,Price with sum as sum,$count as cnt))&$orderby=OrderId', url);
  };
  QueryTests.prototype.applyGroupByAggregateCompute = function () {
    var url = this.context.OrderItems.groupby("[{\"expression\":\"Order/Id\",\"alias\":\"Id\",\"kind\":0},{\"expression\":\"Order/Name\",\"alias\":\"Name\",\"kind\":0}]").
    select("[{\"expression\":\"Order/Id\",\"alias\":\"id\",\"kind\":0},{\"expression\":\"Price with sum\",\"alias\":\"sum\",\"kind\":2},{\"expression\":\"length(Order/Name)\",\"alias\":\"nameLength\",\"kind\":1}]").





    orderby("id").getQueryUrl();
    this.equal('OrderItems?$apply=groupby((Order/Id,Order/Name),aggregate(Price with sum as sum))/compute(length(Order/Name) as nameLength)&$orderby=Order/Id', url);
  };
  QueryTests.prototype.applyGroupByAggregateFilter = function () {
    var url = this.context.OrderItems.filter("Price lt 2").
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Price with sum\",\"alias\":\"sum\",\"kind\":2}]").




    filter("sum gt 0").getQueryUrl();
    this.equal('OrderItems?$apply=filter(Price lt 2)/groupby((OrderId),aggregate(Price with sum as sum))&$filter=sum gt 0', url);
  };
  QueryTests.prototype.applyGroupByAggregateFilterOrdinal = function () {
    var url = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Price with sum\",\"alias\":\"sum\",\"kind\":2}]").




    filter("OrderId eq 2 and sum ge 4").getQueryUrl();
    this.equal('OrderItems?$apply=groupby((OrderId),aggregate(Price with sum as sum))&$filter=OrderId eq 2 and sum ge 4', url);
    var scope = { orderId: 2, sum: 4 };
    var url2 = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Price with sum\",\"alias\":\"sum\",\"kind\":2}]").




    filter("OrderId eq {orderId} and sum ge {sum}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.applyGroupByAggregateOrderBy = function () {
    var url = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Price with sum\",\"alias\":\"sum\",\"kind\":2}]").




    orderby("sum").getQueryUrl();
    this.equal('OrderItems?$apply=groupby((OrderId),aggregate(Price with sum as sum))&$orderby=sum', url);
  };
  QueryTests.prototype.applyGroupByFilter = function () {
    var url = this.context.OrderItems.filter("OrderId eq 1 and Order/Name eq 'Order 1'").
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Order/Name\",\"alias\":\"name\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Order/Name\",\"alias\":\"orderName\",\"kind\":0}]").




    getQueryUrl();
    this.equal("OrderItems?$apply=filter(OrderId eq 1 and Order/Name eq 'Order 1')/groupby((OrderId,Order/Name))", url);
    var scope = { orderName: 'Order 1' };
    var url2 = this.context.OrderItems.filter("OrderId eq 1 and Order/Name eq {orderName}", scope).
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Order/Name\",\"alias\":\"name\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Order/Name\",\"alias\":\"orderName\",\"kind\":0}]").




    getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.applyGroupByMul = function () {
    var url = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Price mul Count with sum\",\"alias\":\"sum\",\"kind\":2}]").




    orderby("orderId").getQueryUrl();
    this.equal('OrderItems?$apply=groupby((OrderId),aggregate(Price mul Count with sum as sum))&$orderby=OrderId', url);
  };
  QueryTests.prototype.applyGroupByOrderBy = function () {
    var url = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Order/Name\",\"alias\":\"name\",\"kind\":0}]").
    orderbyDescending("key/orderId").orderby("key/name").getQueryUrl();
    this.equal('OrderItems?$apply=groupby((OrderId,Order/Name))&$orderby=OrderId desc,Order/Name', url);
  };
  QueryTests.prototype.applyGroupByOrderBySkipTop = function () {
    var url = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Order/Name\",\"alias\":\"name\",\"kind\":0}]").
    orderbyDescending("key/orderId").orderby("key/name").skip(1).top(1).getQueryUrl();
    this.equal('OrderItems?$apply=groupby((OrderId,Order/Name))&$orderby=OrderId desc,Order/Name&$skip=1&$top=1', url);
  };
  QueryTests.prototype.applyGroupBySkip = function () {
    var url = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").
    orderby("key/orderId").skip(1).getQueryUrl();
    this.equal('OrderItems?$apply=groupby((OrderId))&$orderby=OrderId&$skip=1', url);
  };
  QueryTests.prototype.applyGroupByTop = function () {
    var url = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").
    orderby("key/orderId").top(1).getQueryUrl();
    this.equal('OrderItems?$apply=groupby((OrderId))&$orderby=OrderId&$top=1', url);
  };
  QueryTests.prototype.applyGroupByVirtualCount = function () {
    var url = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"substring(Product,0,10) with countdistinct\",\"alias\":\"dcnt\",\"kind\":2},{\"expression\":\"$count\",\"alias\":\"cnt\",\"kind\":2}]").





    filter("dcnt ne cnt").orderby("orderId").getQueryUrl();
    this.equal('OrderItems?$apply=groupby((OrderId),aggregate(substring(Product,0,10) with countdistinct as dcnt,$count as cnt))&$filter=dcnt ne cnt&$orderby=OrderId', url);
    var scope = { pos1: 0, pos2: 10 };
    var url2 = this.context.OrderItems.
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"substring(Product,{pos1},{pos2}) with countdistinct\",\"alias\":\"dcnt\",\"kind\":2},{\"expression\":\"$count\",\"alias\":\"cnt\",\"kind\":2}]",





    scope).filter("dcnt ne cnt").orderby("orderId").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.compute = function () {
    var url = this.context.OrderItems.
    expand("Order").
    select("[{\"expression\":\"Product\",\"alias\":\"product\",\"kind\":0},{\"expression\":\"Count mul Price\",\"alias\":\"Total\",\"kind\":1},{\"expression\":\"Id add OrderId\",\"alias\":\"SumId\",\"kind\":1}]").





    getQueryUrl();
    this.equal('OrderItems?$expand=Order&$select=Product&$compute=Count mul Price as Total,Id add OrderId as SumId', url);
  };
  QueryTests.prototype.count = function () {
    //not applicable
    //let count = await this.context.Orders.count();
    //return count;
  };
  QueryTests.prototype.dbQuery = function () {
    var url = this.context.OrderItemsView.orderby("Name").orderby("Product").getQueryUrl();
    this.equal('OrderItemsView?$orderby=Name,Product', url);
  };
  QueryTests.prototype.expand = function () {
    var url = this.context.Orders.
    expand("Customer").
    expand("Items").
    orderby("Id").getQueryUrl();
    this.equal('Orders?$expand=Customer,Items&$orderby=Id', url);
  };
  QueryTests.prototype.expandCollectionSingleSelectNestedName = function () {
    var url = this.context.Customers.
    expand("CustomerShippingAddresses").thenExpand("ShippingAddress").thenSelect("[{\"expression\":\"Address\",\"alias\":\"p\",\"kind\":0}]").
    asEntitySet().orderby("Country").orderby("Id").select("[{\"expression\":\"Name\",\"alias\":\"p\",\"kind\":0}]").getQueryUrl();
    this.equal('Customers?$expand=CustomerShippingAddresses($expand=ShippingAddress($select=Address))&$select=Name&$orderby=Country,Id', url);
  };
  QueryTests.prototype.expandManyToMany = function () {
    var url = this.context.Customers.
    expand("AltOrders").
    expand("ShippingAddresses").
    expand("Orders").
    orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$expand=AltOrders,ShippingAddresses,Orders&$orderby=Country,Id', url);
  };
  QueryTests.prototype.expandAndSelect = function () {
    var url = this.context.Orders.
    expand("AltCustomer").
    expand("Customer").
    expand("Items").thenOrderby("Id").
    expand("ShippingAddresses").thenOrderby("Id").
    select("[{\"expression\":\"AltCustomerCountry\",\"alias\":\"p1\",\"kind\":0},{\"expression\":\"AltCustomerId\",\"alias\":\"p2\",\"kind\":0},{\"expression\":\"CustomerCountry\",\"alias\":\"p3\",\"kind\":0},{\"expression\":\"CustomerId\",\"alias\":\"p4\",\"kind\":0},{\"expression\":\"Date\",\"alias\":\"p5\",\"kind\":0},{\"expression\":\"Id\",\"alias\":\"p6\",\"kind\":0},{\"expression\":\"Name\",\"alias\":\"p7\",\"kind\":0},{\"expression\":\"Status\",\"alias\":\"p8\",\"kind\":0}]").










    orderby("p6").getQueryUrl();
    this.equal('Orders?$expand=AltCustomer,Customer,Items($orderby=Id),ShippingAddresses($orderby=Id)&$select=AltCustomerCountry,AltCustomerId,CustomerCountry,CustomerId,Date,Id,Name,Status&$orderby=Id', url);
  };
  QueryTests.prototype.expandExpandFilter = function () {
    var url = this.context.Customers.
    expand("AltOrders").thenExpand("Items").thenFilter("contains(Product,'unknown')").thenOrderby("Id").
    expand("Orders").thenExpand("Items").thenFilter("contains(Product,'unknown')").thenOrderby("Id").
    orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$expand=AltOrders($expand=Items($filter=contains(Product,\'unknown\');$orderby=Id)),Orders($expand=Items($filter=contains(Product,\'unknown\');$orderby=Id))&$orderby=Country,Id', url);
    var product = 'unknown';
    var url2 = this.context.Customers.
    expand("AltOrders").thenExpand("Items").thenFilter("contains(Product,{product})", { product: product }).thenOrderby("Id").
    expand("Orders").thenExpand("Items").thenFilter("contains(Product,{product})", { product: product }).thenOrderby("Id").
    orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.expandExpandMany = function () {
    var url = this.context.Customers.
    expand("AltOrders").thenExpand("Items").thenOrderbyDescending("Price").
    expand("AltOrders").thenExpand("ShippingAddresses").thenOrderbyDescending("Id").
    expand("Orders").thenExpand("Items").thenOrderbyDescending("Price").
    expand("Orders").thenExpand("ShippingAddresses").thenOrderbyDescending("Id").
    orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$expand=AltOrders($expand=Items($orderby=Price desc),ShippingAddresses($orderby=Id desc)),Orders($expand=Items($orderby=Price desc),ShippingAddresses($orderby=Id desc))&$orderby=Country,Id', url);
  };
  QueryTests.prototype.expandExpandOne = function () {
    var url = this.context.OrderItems.
    expand("Order").thenExpand("AltCustomer").
    expand("Order").thenExpand("Customer").orderby("Id").getQueryUrl();
    this.equal('OrderItems?$expand=Order($expand=AltCustomer,Customer)&$orderby=Id', url);
  };
  QueryTests.prototype.expandExpandOrderBy = function () {
    var url = this.context.Customers.
    expand("Orders").thenExpand("Items").thenOrderbyDescending("Id").
    orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$expand=Orders($expand=Items($orderby=Id desc))&$orderby=Country,Id', url);
  };
  QueryTests.prototype.expandExpandSkipTop = function () {
    var url = this.context.Customers.
    expand("AltOrders").thenExpand("Items").thenOrderby("Id").thenTop(1).
    expand("Orders").thenExpand("Items").thenOrderby("Id").thenTop(1).
    orderby("Country").orderby("Id").skip(1).top(3).getQueryUrl();
    this.equal('Customers?$expand=AltOrders($expand=Items($orderby=Id;$top=1)),Orders($expand=Items($orderby=Id;$top=1))&$orderby=Country,Id&$skip=1&$top=3', url);
  };
  QueryTests.prototype.expandInverseProperty = function () {
    var url = this.context.Customers.
    expand("AltOrders").
    expand("Orders").
    orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$expand=AltOrders,Orders&$orderby=Country,Id', url);
  };
  QueryTests.prototype.expandManyFilter = function () {
    var url = this.context.Customers.
    expand("Orders").thenFilter("Status eq OdataToEntity.Test.Model.OrderStatus'Processing'").
    orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$expand=Orders($filter=Status eq OdataToEntity.Test.Model.OrderStatus\'Processing\')&$orderby=Country,Id', url);
    var orderStatus;
    var url2 = this.context.Customers.
    expand("Orders").thenFilter("Status eq {orderStatus}", { orderStatus: this.odataNamespace + '.OrderStatus\'Processing\'' }).
    orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.expandNestedSelect = function () {
    var url = this.context.Customers.
    expand("Orders").thenSelect("[{\"expression\":\"AltCustomerCountry\",\"alias\":\"p1\",\"kind\":0},{\"expression\":\"AltCustomerId\",\"alias\":\"p2\",\"kind\":0},{\"expression\":\"CustomerCountry\",\"alias\":\"p3\",\"kind\":0},{\"expression\":\"CustomerId\",\"alias\":\"p4\",\"kind\":0},{\"expression\":\"Date\",\"alias\":\"p5\",\"kind\":0},{\"expression\":\"Id\",\"alias\":\"p6\",\"kind\":0},{\"expression\":\"Name\",\"alias\":\"p7\",\"kind\":0},{\"expression\":\"Status\",\"alias\":\"p8\",\"kind\":0}]").










    asEntitySet().orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$expand=Orders($select=AltCustomerCountry,AltCustomerId,CustomerCountry,CustomerId,Date,Id,Name,Status)&$orderby=Country,Id', url);
  };
  QueryTests.prototype.expandNullableNestedSelect = function () {
    var url = this.context.Orders.
    expand("AltCustomer").thenSelect("[{\"expression\":\"Address\",\"alias\":\"p1\",\"kind\":0},{\"expression\":\"Country\",\"alias\":\"p2\",\"kind\":0},{\"expression\":\"Id\",\"alias\":\"p3\",\"kind\":0},{\"expression\":\"Name\",\"alias\":\"p4\",\"kind\":0},{\"expression\":\"Sex\",\"alias\":\"p5\",\"kind\":0}]").







    asEntitySet().orderby("Id").getQueryUrl();
    this.equal('Orders?$expand=AltCustomer($select=Address,Country,Id,Name,Sex)&$orderby=Id', url);
  };
  QueryTests.prototype.expandOneFilter = function () {
    var url = this.context.Orders.
    expand("AltCustomer").thenFilter("Sex eq OdataToEntity.Test.Model.Sex'Male'").
    getQueryUrl();
    this.equal("Orders?$expand=AltCustomer($filter=Sex eq OdataToEntity.Test.Model.Sex'Male')", url);
    var sex = oe.Sex.Male;
    var url2 = this.context.Orders.
    expand("AltCustomer").thenFilter("Sex eq {sex}", { sex: this.odataNamespace + '.Sex\'Male\'' }).
    getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.expandStar = function () {
    //not applicable
  };
  QueryTests.prototype.filterAll = function () {
    var url = this.context.Orders.filter("Items/all(d:d/Price ge 2.1)").getQueryUrl();
    this.equal('Orders?$filter=Items/all(d:d/Price ge 2.1)', url);
    var price = 2.1;
    var url2 = this.context.Orders.filter("Items/all(d:d/Price ge {price})", { price: price }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterAndHaving = function () {
    var url = this.context.OrderItems.filter("Order/CustomerCountry ne 'UN'").
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Price mul Count with sum\",\"alias\":\"sum\",\"kind\":2}]").




    filter("sum gt 7").getQueryUrl();
    this.equal("OrderItems?$apply=filter(Order/CustomerCountry ne 'UN')/groupby((OrderId),aggregate(Price mul Count with sum as sum))&$filter=sum gt 7", url);
    var customerCountry = 'UN';
    var sum = 7;
    var scope = { customerCountry: customerCountry, sum: sum };
    var url2 = this.context.OrderItems.filter("Order/CustomerCountry ne {customerCountry}", scope).
    groupby("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0}]").select("[{\"expression\":\"OrderId\",\"alias\":\"orderId\",\"kind\":0},{\"expression\":\"Price mul Count with sum\",\"alias\":\"sum\",\"kind\":2}]").




    filter("sum gt {sum}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterAny = function () {
    var url = this.context.Orders.filter("Items/any(d:d/Count gt 2)").getQueryUrl();
    this.equal('Orders?$filter=Items/any(d:d/Count gt 2)', url);
    var count = 2;
    var url2 = this.context.Orders.filter("Items/any(d:d/Count gt {count})", { count: count }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterCount = function () {
    var url = this.context.Orders.filter("Items/$count gt 2").getQueryUrl();
    this.equal('Orders?$filter=Items/$count gt 2', url);
    var length = 2;
    var url2 = this.context.Orders.filter("Items/$count gt {length}", { length: length }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterDateTime = function () {
    var dt = new Date('2016-07-04T19:10:10.8237573+03:00');
    var url = this.context.Categories.filter("DateTime ge {dt}", { dt: dt }).getQueryUrl();
    this.equal('Categories?$filter=DateTime ge 2016-07-04T16:10:10.823Z', url);
  };
  QueryTests.prototype.filterDateTimeNull = function () {
    var url = this.context.Categories.filter("DateTime eq null").getQueryUrl();
    this.equal('Categories?$filter=DateTime eq null', url);
    var dt = null;
    var url2 = this.context.Categories.filter("DateTime eq {dt}", { dt: dt }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterDateTimeOffset = function () {
    var url = this.context.Orders.filter("Date ge 2016-07-04T16:10:10.823Z").getQueryUrl();
    this.equal('Orders?$filter=Date ge 2016-07-04T16:10:10.823Z', url);
  };
  QueryTests.prototype.filterDateTimeOffsetNull = function () {
    var url = this.context.Orders.filter("Date eq null").getQueryUrl();
    this.equal('Orders?$filter=Date eq null', url);
  };
  QueryTests.prototype.filterDateTimeOffsetYearMonthDay = function () {
    var url = this.context.Orders.filter("year(Date) eq 2016 and month(Date) gt 3 and day(Date) lt 20").getQueryUrl();
    this.equal('Orders?$filter=year(Date) eq 2016 and month(Date) gt 3 and day(Date) lt 20', url);
    var scope = { year: 2016, month: 3, day: 20 };
    var url2 = this.context.Orders.filter("year(Date) eq {year} and month(Date) gt {month} and day(Date) lt {day}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterDateTimeYearMonthDay = function () {
    var url = this.context.Categories.filter("year(DateTime) eq 2016 and month(DateTime) gt 3 and day(DateTime) lt 20").getQueryUrl();
    this.equal('Categories?$filter=year(DateTime) eq 2016 and month(DateTime) gt 3 and day(DateTime) lt 20', url);
    var scope = { year: 2016, month: 3, day: 20 };
    var url2 = this.context.Categories.filter("year(DateTime) eq {year} and month(DateTime) gt {month} and day(DateTime) lt {day}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterDecimal = function () {
    var url = this.context.OrderItems.filter("Price gt 2").getQueryUrl();
    this.equal('OrderItems?$filter=Price gt 2', url);
    var price = 2;
    var url2 = this.context.OrderItems.filter("Price gt {price}", { price: price }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterDecimalNull = function () {
    var url = this.context.OrderItems.filter("Price eq null").getQueryUrl();
    this.equal('OrderItems?$filter=Price eq null', url);
    var price = null;
    var url2 = this.context.OrderItems.filter("Price eq {price}", { price: price }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterEnum = function () {
    var url = this.context.Customers.filter("Sex eq OdataToEntity.Test.Model.Sex'Female'").getQueryUrl();
    this.equal('Customers?$filter=Sex eq OdataToEntity.Test.Model.Sex\'Female\'', url);
    var scope = { sex: 'OdataToEntity.Test.Model.Sex\'Female\'' };
    var url2 = this.context.Customers.filter("Sex eq {sex}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.FilterEnumGe = function () {
    var url = this.context.Orders.filter("Status ge OdataToEntity.Test.Model.OrderStatus'Unknown'").orderby("Id").getQueryUrl();
    this.equal('Orders?$filter=Status ge OdataToEntity.Test.Model.OrderStatus\'Unknown\'&$orderby=Id', url);
    var scope = { status: 'OdataToEntity.Test.Model.OrderStatus\'Unknown\'' };
    var url2 = this.context.Orders.filter("Status ge {status}", scope).orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterEnumLt = function () {
    var url = this.context.Orders.filter("OdataToEntity.Test.Model.OrderStatus'Unknown' lt Status").getQueryUrl();
    this.equal('Orders?$filter=OdataToEntity.Test.Model.OrderStatus\'Unknown\' lt Status', url);
    var scope = { status: 'OdataToEntity.Test.Model.OrderStatus\'Unknown\'' };
    var url2 = this.context.Orders.filter("{status} lt Status", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterEnumNull = function () {
    var url = this.context.Customers.filter("Sex ne null and Address ne null").orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$filter=Sex ne null and Address ne null&$orderby=Country,Id', url);
    var scope = { sex: null, address: null };
    var url2 = this.context.Customers.filter("Sex ne {sex} and Address ne {address}", scope).orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterEnumNullableGe = function () {
    var url = this.context.Customers.filter("Sex ge OdataToEntity.Test.Model.Sex'Male'").orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$filter=Sex ge OdataToEntity.Test.Model.Sex\'Male\'&$orderby=Country,Id', url);
    var scope = { sex: 'OdataToEntity.Test.Model.Sex\'Male\'' };
    var url2 = this.context.Customers.filter("Sex ge {sex}", scope).orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterEnumNullableLt = function () {
    var url = this.context.Customers.filter("OdataToEntity.Test.Model.Sex'Male' lt Sex").orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$filter=OdataToEntity.Test.Model.Sex\'Male\' lt Sex&$orderby=Country,Id', url);
    var scope = { sex: 'OdataToEntity.Test.Model.Sex\'Male\'' };
    var url2 = this.context.Customers.filter("{sex} lt Sex", scope).orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterEnumNotNullAndStringNotNull = function () {
    var url = this.context.Customers.filter("Sex eq null and Address ne null").getQueryUrl();
    this.equal('Customers?$filter=Sex eq null and Address ne null', url);
    var scope = { sex: null, address: null };
    var url2 = this.context.Customers.filter("Sex eq {sex} and Address ne {address}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterEnumNullAndStringNull = function () {
    var url = this.context.Customers.filter("Sex eq null and Address eq null").getQueryUrl();
    this.equal('Customers?$filter=Sex eq null and Address eq null', url);
    var scope = { sex: null, address: null };
    var url2 = this.context.Customers.filter("Sex eq {sex} and Address eq {address}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterIn = function () {
    var url = this.context.OrderItems.filter("Price in (1.1,1.2,1.3)").orderby("Id").getQueryUrl();
    this.equal('OrderItems?$filter=Price in (1.1,1.2,1.3)&$orderby=Id', url);
    var items = [1.1, 1.2, 1.3];
    var url2 = this.context.OrderItems.filter("Price in ({items})", { items: items }).orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterInEnum = function () {
    var url = this.context.Customers.filter("Sex in (OdataToEntity.Test.Model.Sex'Male',OdataToEntity.Test.Model.Sex'Female')").orderby("Country").orderby("Id").getQueryUrl();
    this.equal('Customers?$filter=Sex in (OdataToEntity.Test.Model.Sex\'Male\',OdataToEntity.Test.Model.Sex\'Female\')&$orderby=Country,Id', url);
    var scope = { items: ['OdataToEntity.Test.Model.Sex\'Male\'', 'OdataToEntity.Test.Model.Sex\'Female\''] };
    var url2 = this.context.Customers.filter("Sex in ({items})", scope).orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterInt = function () {
    var url = this.context.OrderItems.filter("Count ge 2").getQueryUrl();
    this.equal('OrderItems?$filter=Count ge 2', url);
    var scope = { count: 2 };
    var url2 = this.context.OrderItems.filter("Count ge {count}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterIntNull = function () {
    var url = this.context.OrderItems.filter("Count eq null").getQueryUrl();
    this.equal('OrderItems?$filter=Count eq null', url);
    var count = null;
    var url2 = this.context.OrderItems.filter("Count eq {count}", { count: count }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterNavigation = function () {
    var url = this.context.OrderItems.filter("Order/Customer/Name eq 'Ivan'").getQueryUrl();
    this.equal('OrderItems?$filter=Order/Customer/Name eq \'Ivan\'', url);
    var scope = { name: 'Ivan' };
    var url2 = this.context.OrderItems.filter("Order/Customer/Name eq {name}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterSegment = function () {
    //not supported
  };
  QueryTests.prototype.filterStringConcat = function () {
    var url = this.context.Customers.filter("concat(concat(Name,' hello'),' world') eq 'Ivan hello world'").getQueryUrl();
    this.equal("Customers?$filter=concat(concat(Name,' hello'),' world') eq 'Ivan hello world'", url);
    var scope = { str1: ' hello', str2: ' world' };
    var url2 = this.context.Customers.filter("concat(concat(Name,{str1}),{str2}) eq 'Ivan hello world'", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringEq = function () {
    var url = this.context.Customers.filter("Address eq 'Tula'").getQueryUrl();
    this.equal("Customers?$filter=Address eq 'Tula'", url);
    var address = 'Tula';
    var url2 = this.context.Customers.filter("Address eq {address}", { address: address }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringGe = function () {
    var url = this.context.Customers.filter("Address ge 'Tula'").getQueryUrl();
    this.equal("Customers?$filter=Address ge 'Tula'", url);
    var address = 'Tula';
    var url2 = this.context.Customers.filter("Address ge {address}", { address: address }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringGt = function () {
    var url = this.context.Customers.filter("Address gt 'Tula'").getQueryUrl();
    this.equal("Customers?$filter=Address gt 'Tula'", url);
    var address = 'Tula';
    var url2 = this.context.Customers.filter("Address gt {address}", { address: address }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringLe = function () {
    var url = this.context.Customers.filter("Address le 'Tula'").orderby("Country").orderby("Id").getQueryUrl();
    this.equal("Customers?$filter=Address le 'Tula'&$orderby=Country,Id", url);
    var address = 'Tula';
    var url2 = this.context.Customers.filter("Address le {address}", { address: address }).orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringLt = function () {
    var url = this.context.Customers.filter("Address lt 'Tula'").orderby("Country").orderby("Id").getQueryUrl();
    this.equal("Customers?$filter=Address lt 'Tula'&$orderby=Country,Id", url);
    var address = 'Tula';
    var url2 = this.context.Customers.filter("Address lt {address}", { address: address }).orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringNe = function () {
    var url = this.context.Customers.filter("Address ne 'Tula'").orderby("Country").orderby("Id").getQueryUrl();
    this.equal("Customers?$filter=Address ne 'Tula'&$orderby=Country,Id", url);
    var address = 'Tula';
    var url2 = this.context.Customers.filter("Address ne {address}", { address: address }).orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringEndsWith = function () {
    var url = this.context.Customers.filter("endswith(Name,'asha')").getQueryUrl();
    this.equal("Customers?$filter=endswith(Name,'asha')", url);
    var str = 'asha';
    var url2 = this.context.Customers.filter("endswith(Name,{str})", { str: str }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringLength = function () {
    var url = this.context.Customers.filter("length(Name) eq 5").getQueryUrl();
    this.equal('Customers?$filter=length(Name) eq 5', url);
    var length = 5;
    var url2 = this.context.Customers.filter("length(Name) eq {length}", { length: length }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringIndexOf = function () {
    var url = this.context.Customers.filter("indexof(Name,'asha') eq 1").getQueryUrl();
    this.equal("Customers?$filter=indexof(Name,'asha') eq 1", url);
    var pos = 1;
    var url2 = this.context.Customers.filter("indexof(Name,'asha') eq {pos}", { pos: pos }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringStartsWith = function () {
    var url = this.context.Customers.filter("startswith(Name,'S')").getQueryUrl();
    this.equal("Customers?$filter=startswith(Name,'S')", url);
    var str = 'S';
    var url2 = this.context.Customers.filter("startswith(Name,{str})", { str: str }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringSubstring = function () {
    var url = this.context.Customers.filter("substring(Name,1,1) eq substring(Name,4,1)").getQueryUrl();
    this.equal('Customers?$filter=substring(Name,1,1) eq substring(Name,4,1)', url);
    var pos1 = 1;
    var pos2 = 1;
    var pos3 = 4;
    var pos4 = 1;
    var scope = { pos1: pos1, pos2: pos2, pos3: pos3, pos4: pos4 };
    var url2 = this.context.Customers.filter("substring(Name,{pos1},{pos2}) eq substring(Name,{pos3},{pos4})", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringToLower = function () {
    var url = this.context.Customers.filter("tolower(Name) eq 'sasha'").getQueryUrl();
    this.equal("Customers?$filter=tolower(Name) eq 'sasha'", url);
    var name = 'sasha';
    var url2 = this.context.Customers.filter("tolower(Name) eq {name}", { name: name }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringToUpper = function () {
    var url = this.context.Customers.filter("toupper(Name) eq 'SASHA'").getQueryUrl();
    this.equal("Customers?$filter=toupper(Name) eq 'SASHA'", url);
    var name = 'SASHA';
    var url2 = this.context.Customers.filter("toupper(Name) eq {name}", { name: name }).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.filterStringTrim = function () {
    var url = this.context.Customers.filter("trim(concat(Name,' ')) eq trim(Name)").orderby("Country").orderby("Id").getQueryUrl();
    this.equal("Customers?$filter=trim(concat(Name,' ')) eq trim(Name)&$orderby=Country,Id", url);
    var space = ' ';
    var url2 = this.context.Customers.filter("trim(concat(Name,{space})) eq trim(Name)", { space: space }).orderby("Country").orderby("Id").getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.keyComposition = function () {
    var url = this.context.Customers.key({ Country: 'RU', Id: 1 }).getQueryUrl();
    this.equal("Customers(Country='RU',Id=1)", url);
  };
  QueryTests.prototype.keyExpand = function () {
    var url = this.context.Orders.key(1).
    expand("Customer").
    expand("Items").
    getQueryUrl();
    this.equal('Orders(1)?$expand=Customer,Items', url);
  };
  QueryTests.prototype.keyFilter = function () {
    var url = this.context.Orders.key(1, "Items").filter("Count ge 2").getQueryUrl();
    this.equal('Orders(1)/Items?$filter=Count ge 2', url);
    var scope = { id: 1, count: 2 };
    var url2 = this.context.Orders.key(scope.id, "Items").filter("Count ge {count}", scope).getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.keyMultipleNavigationOne = function () {
    var url = this.context.OrderItems.key(1, "Order/Customer").getQueryUrl();
    this.equal('OrderItems(1)/Order/Customer', url);
  };
  QueryTests.prototype.keyNavigationGroupBy = function () {
  };
  QueryTests.prototype.keyOrderBy = function () {
    var url = this.context.Orders.key(1, "Items").orderby("Count").orderby("Price").getQueryUrl();
    this.equal('Orders(1)/Items?$orderby=Count,Price', url);
  };
  QueryTests.prototype.mathFunctions = function () {
    var url = this.context.OrderItems.
    select("[{\"expression\":\"Price\",\"alias\":\"Price\",\"kind\":0},{\"expression\":\"ceiling(Price)\",\"alias\":\"Ceiling\",\"kind\":1},{\"expression\":\"floor(Price)\",\"alias\":\"Floor\",\"kind\":1},{\"expression\":\"round(Price)\",\"alias\":\"Round\",\"kind\":1}]").






    orderby("Price").getQueryUrl();
    this.equal('OrderItems?$select=Price&$compute=ceiling(Price) as Ceiling,floor(Price) as Floor,round(Price) as Round&$orderby=Price', url);
  };
  QueryTests.prototype.orderByColumnsMissingInSelect = function () {
    var url = this.context.OrderItems.orderbyDescending("Count").orderby("Order/Customer/Name").orderbyDescending("Id").
    select("[{\"expression\":\"Product\",\"alias\":\"p1\",\"kind\":0},{\"expression\":\"Id\",\"alias\":\"p2\",\"kind\":0}]").




    getQueryUrl();
    this.equal('OrderItems?$select=Product,Id&$orderby=Count desc,Order/Customer/Name,Id desc', url);
  };
  QueryTests.prototype.orderByColumnsMissingInSelectNavigationFirst = function () {
    var url = this.context.OrderItems.orderbyDescending("Order/Customer/Name").orderby("Count").orderbyDescending("Id").
    select("[{\"expression\":\"Product\",\"alias\":\"p1\",\"kind\":0},{\"expression\":\"Id\",\"alias\":\"p2\",\"kind\":0}]").




    getQueryUrl();
    this.equal('OrderItems?$select=Product,Id&$orderby=Order/Customer/Name desc,Count,Id desc', url);
  };
  QueryTests.prototype.orderByDesc = function () {
    var url = this.context.OrderItems.orderbyDescending("Id").orderbyDescending("Count").orderbyDescending("Price").getQueryUrl();
    this.equal('OrderItems?$orderby=Id desc,Count desc,Price desc', url);
  };
  QueryTests.prototype.orderByNavigation = function () {
    var url = this.context.OrderItems.orderbyDescending("Order/Customer/Sex").orderby("Order/Customer/Name").orderbyDescending("Id").getQueryUrl();
    this.equal('OrderItems?$orderby=Order/Customer/Sex desc,Order/Customer/Name,Id desc', url);
  };
  QueryTests.prototype.parameterization = function () {
    var url = this.context.Orders.
    filter("AltCustomerId eq 3 and CustomerId eq 4 and (year(Date) eq 2016 and month(Date) gt 11 and day(Date) lt 20 or Date eq null) and contains(Name,'unknown') and Status eq OdataToEntity.Test.Model.OrderStatus'Unknown'").
    expand("Items").thenFilter("(Count eq 0 or Count eq null) and (Price eq 0 or Price eq null) and (contains(Product,'unknown') or contains(Product,'null')) and OrderId gt -1 and Id ne 1").
    getQueryUrl();
    this.equal("Orders?$filter=AltCustomerId eq 3 and CustomerId eq 4 and (year(Date) eq 2016 and month(Date) gt 11 and day(Date) lt 20 or Date eq null) and contains(Name,'unknown') and Status eq OdataToEntity.Test.Model.OrderStatus'Unknown'&$expand=Items($filter=(Count eq 0 or Count eq null) and (Price eq 0 or Price eq null) and (contains(Product,'unknown') or contains(Product,'null')) and OrderId gt -1 and Id ne 1)", url);
    var s = {
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
      id: 1 };

    var url2 = this.context.Orders.
    filter("AltCustomerId eq {altCustomerId} and CustomerId eq {customerId} and (year(Date) eq {dateYear} and month(Date) gt {dateMonth} and day(Date) lt {dateDay} or Date eq {date}) and contains(Name,{name}) and Status eq {status}", s).
    expand("Items").thenFilter("(Count eq {count1} or Count eq {count2}) and (Price eq {price1} or Price eq {price2}) and (contains(Product,{product1}) or contains(Product,{product2})) and OrderId gt {orderId} and Id ne {id}", s).
    getQueryUrl();
    this.equalUrl(url, url2);
  };
  QueryTests.prototype.referencedModels = function () {
    //not applicable
  };
  QueryTests.prototype.select = function () {
    var url = this.context.Orders.select("[{\"expression\":\"AltCustomer\",\"alias\":\"p01\",\"kind\":0},{\"expression\":\"AltCustomerCountry\",\"alias\":\"p02\",\"kind\":0},{\"expression\":\"AltCustomerId\",\"alias\":\"p03\",\"kind\":0},{\"expression\":\"Customer\",\"alias\":\"p05\",\"kind\":0},{\"expression\":\"CustomerCountry\",\"alias\":\"p04\",\"kind\":0},{\"expression\":\"CustomerId\",\"alias\":\"p06\",\"kind\":0},{\"expression\":\"Date\",\"alias\":\"p07\",\"kind\":0},{\"expression\":\"Id\",\"alias\":\"p08\",\"kind\":0},{\"expression\":\"Items\",\"alias\":\"p09\",\"kind\":0},{\"expression\":\"Name\",\"alias\":\"p10\",\"kind\":0},{\"expression\":\"ShippingAddresses\",\"alias\":\"p11\",\"kind\":0},{\"expression\":\"Status\",\"alias\":\"p12\",\"kind\":0}]").














    orderby("p08").getQueryUrl();
    this.equal('Orders?$select=AltCustomer,AltCustomerCountry,AltCustomerId,Customer,CustomerCountry,CustomerId,Date,Id,Items,Name,ShippingAddresses,Status&$orderby=Id', url);
  };
  QueryTests.prototype.selectName = function () {
    var url = this.context.Orders.select("[{\"expression\":\"Name\",\"alias\":\"p\",\"kind\":0}]").getQueryUrl();
    this.equal('Orders?$select=Name', url);
  };
  QueryTests.prototype.selectNestedName = function () {
    var url = this.context.Orders.
    expand("Items").thenFilter("OrderId eq 1").thenSelect("[{\"expression\":\"Product\",\"alias\":\"p\",\"kind\":0}]").
    asEntitySet().select("[{\"expression\":\"Name\",\"alias\":\"p\",\"kind\":0}]").getQueryUrl();
    this.equal('Orders?$expand=Items($filter=OrderId eq 1;$select=Product)&$select=Name', url);
  };
  QueryTests.prototype.table = function () {
    var url = this.context.Orders.orderby("Id").getQueryUrl();
    this.equal('Orders?$orderby=Id', url);
  };
  QueryTests.prototype.timeDateTimeFunction = function () {
    var url = this.context.Categories.
    select("[{\"expression\":\"DateTime\",\"alias\":\"DateTime\",\"kind\":0},{\"expression\":\"hour(DateTime)\",\"alias\":\"Hour\",\"kind\":1},{\"expression\":\"minute(DateTime)\",\"alias\":\"Minute\",\"kind\":1},{\"expression\":\"second(DateTime)\",\"alias\":\"Second\",\"kind\":1}]").






    orderby("DateTime").getQueryUrl();
    this.equal('Categories?$select=DateTime&$compute=hour(DateTime) as Hour,minute(DateTime) as Minute,second(DateTime) as Second&$orderby=DateTime', url);
  };
  QueryTests.prototype.timeDateTimeOffsetFunction = function () {
    var url = this.context.Orders.
    select("[{\"expression\":\"Date\",\"alias\":\"Date\",\"kind\":0},{\"expression\":\"hour(Date)\",\"alias\":\"Hour\",\"kind\":1},{\"expression\":\"minute(Date)\",\"alias\":\"Minute\",\"kind\":1},{\"expression\":\"second(Date)\",\"alias\":\"Second\",\"kind\":1}]").






    orderby("Date").getQueryUrl();
    this.equal('Orders?$select=Date&$compute=hour(Date) as Hour,minute(Date) as Minute,second(Date) as Second&$orderby=Date', url);
  };
  QueryTests.prototype.topSkip = function () {
    var url = this.context.Customers.orderby("Id").skip(2).top(3).getQueryUrl();
    this.equal('Customers?$orderby=Id&$skip=2&$top=3', url);
  };
  QueryTests.prototype.runAll = function () {
    this.applyFilter();
    this.applyFilterGroupBy();
    this.applyGroupBy();
    this.applyGroupByAggregate();
    this.applyGroupByAggregateCompute();
    this.applyGroupByAggregateFilter();
    this.applyGroupByAggregateFilterOrdinal();
    this.applyGroupByAggregateOrderBy();
    this.applyGroupByFilter();
    this.applyGroupByMul();
    this.applyGroupByOrderBy();
    this.applyGroupByOrderBySkipTop();
    this.applyGroupBySkip();
    this.applyGroupByTop();
    this.applyGroupByVirtualCount();
    this.compute();
    this.count();
    this.dbQuery();
    this.expand();
    this.expandCollectionSingleSelectNestedName();
    this.expandManyToMany();
    this.expandAndSelect();
    this.expandExpandFilter();
    this.expandExpandMany();
    this.expandExpandOne();
    this.expandExpandSkipTop();
    this.expandInverseProperty();
    this.expandManyFilter();
    this.expandNestedSelect();
    this.expandNullableNestedSelect();
    this.expandOneFilter();
    this.filterAll();
    this.filterAndHaving();
    this.filterAny();
    this.filterCount();
    this.filterDateTime();
    this.filterDateTimeNull();
    this.filterDateTimeOffset();
    this.filterDateTimeOffsetNull();
    this.filterDateTimeOffsetYearMonthDay();
    this.filterDateTimeYearMonthDay();
    this.filterDecimal();
    this.filterDecimalNull();
    this.filterEnum();
    this.FilterEnumGe();
    this.filterEnumLt();
    this.filterEnumNull();
    this.filterEnumNullableGe();
    this.filterEnumNullableLt();
    this.filterEnumNotNullAndStringNotNull();
    this.filterEnumNullAndStringNull();
    this.filterIn();
    this.filterInEnum();
    this.filterInt();
    this.filterIntNull();
    this.filterNavigation();
    this.filterSegment();
    this.filterStringConcat();
    this.filterStringEq();
    this.filterStringGe();
    this.filterStringGt();
    this.filterStringLe();
    this.filterStringLt();
    this.filterStringNe();
    this.filterStringEndsWith();
    this.filterStringLength();
    this.filterStringIndexOf();
    this.filterStringStartsWith();
    this.filterStringSubstring();
    this.filterStringToLower();
    this.filterStringToUpper();
    this.filterStringTrim();
    this.keyComposition();
    this.keyExpand();
    this.keyFilter();
    this.keyMultipleNavigationOne();
    this.keyNavigationGroupBy();
    this.keyOrderBy();
    this.mathFunctions();
    this.orderByColumnsMissingInSelect();
    this.orderByColumnsMissingInSelectNavigationFirst();
    this.orderByDesc();
    this.orderByNavigation();
    this.parameterization();
    this.referencedModels();
    this.select();
    this.selectName();
    this.selectNestedName();
    this.table();
    this.timeDateTimeFunction();
    this.timeDateTimeOffsetFunction();
    this.topSkip();
  };
  QueryTests.prototype.equal = function (expected, actual) {
    var expectedQuery = this.baseUri + '/' + expected;
    var actualQuery = decodeURIComponent(actual.href).replace(/\+/g, ' ');
    if (expectedQuery !== actualQuery)
    throw 'expected: ' + expectedQuery + '\r\n' + 'actual: ' + actualQuery;
    console.log(expected);
    //this.execute(actual);
  };
  QueryTests.prototype.equalUrl = function (expected, actual) {
    if (expected.href !== actual.href)
    throw 'expected href: ' + expected.href + '\r\n' + 'actual href: ' + actual.href;
  };
  QueryTests.prototype.execute = function (queryUrl) {
    var request = new cross_fetch_1.Request(queryUrl.href, {
      headers: new cross_fetch_1.Headers({
        "Content-Type": "application/json" }),

      method: "GET" });

    cross_fetch_1.fetch(request).then(function (r) {return r.text().then(function (t) {return console.log(t);});});
  };
  return QueryTests;
}();
exports.QueryTests = QueryTests;