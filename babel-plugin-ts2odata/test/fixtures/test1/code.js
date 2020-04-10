"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
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
var OrderContext_1 = require("../../../../ts2odata/test/OrderContext");
var oe = __importStar(require("../../../../ts2odata/test/order"));
var QueryTests = /** @class */ (function () {
    function QueryTests(baseUri, odataParser) {
        this.odataNamespace = 'OdataToEntity.Test.Model';
        this.baseUri = baseUri;
        this.context = OdataContext_1.OdataContext.create(OrderContext_1.OrderContext, baseUri, this.odataNamespace, odataParser);
    }
    QueryTests.prototype.applyFilter = function () {
        //not applicable
    };
    QueryTests.prototype.applyFilterGroupBy = function () {
        var url = this.context.Orders.filter(function (o) { return o.Status == oe.OrderStatus.Unknown; })
            .groupby(function (o) { return { Name: o.Name }; }).select(function (g) {
                return {
                    cnt: g.countdistinct(function (o) { return o.Id; })
                };
            }).getQueryUrl();
        this.equal("Orders?$apply=filter(Status eq OdataToEntity.Test.Model.OrderStatus'Unknown')/groupby((Name),aggregate(Id with countdistinct as cnt))", url);
        var scope = { orderStatus: this.odataNamespace + '.OrderStatus' + "'" + oe.OrderStatus.Unknown + "'" };
        var url2 = this.context.Orders.filter(function (o) { return o.Status == scope.orderStatus; }, scope)
            .groupby(function (o) { return { Name: o.Name }; }).select(function (g) {
                return {
                    cnt: g.countdistinct(function (o) { return o.Id; })
                };
            }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.applyGroupBy = function () {
        var url = this.context.OrderItems.groupby(function (i) { return { Product: i.Product }; }).orderby(function (g) { return g.key.Product; }).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((Product))&$orderby=Product', url);
    };
    QueryTests.prototype.applyGroupByAggregate = function () {
        var url = this.context.OrderItems.groupby(function (i) { return { OrderId: i.OrderId, Status: i.Order.Status }; })
            .select(function (g) {
                return {
                    orderId: g.key.OrderId,
                    avg: g.average(function (i) { return i.Price; }),
                    dcnt: g.countdistinct(function (i) { return i.Product; }),
                    max: g.max(function (i) { return i.Price; }),
                    max_status: g.max(function (_) { return g.key.Status; }),
                    min: g.min(function (i) { return i.Price; }),
                    sum: g.sum(function (i) { return i.Price; }),
                    cnt: g.count()
                };
            }).orderby(function (g) { return g.orderId; }).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId,Order/Status),aggregate(Price with average as avg,Product with countdistinct as dcnt,Price with max as max,Order/Status with max as max_status,Price with min as min,Price with sum as sum,$count as cnt))&$orderby=OrderId', url);
    };
    QueryTests.prototype.applyGroupByAggregateCompute = function () {
        var url = this.context.OrderItems.groupby(function (i) { return { Id: i.Order.Id, Name: i.Order.Name }; })
            .select(function (g) {
                return {
                    id: g.key.Id,
                    sum: g.sum(function (i) { return i.Price; }),
                    nameLength: OdataFunctions_1.OdataFunctions.stringLength(g.key.Name)
                };
            }).orderby(function (g) { return g.id; }).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((Order/Id,Order/Name),aggregate(Price with sum as sum))/compute(length(Order/Name) as nameLength)&$orderby=Order/Id', url);
    };
    QueryTests.prototype.applyGroupByAggregateFilter = function () {
        var url = this.context.OrderItems.filter(function (i) { return i.Price < 2; })
            .groupby(function (i) { return { orderId: i.OrderId }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(function (i) { return i.Price; })
                };
            }).filter(function (g) { return g.sum > 0; }).getQueryUrl();
        this.equal('OrderItems?$apply=filter(Price lt 2)/groupby((OrderId),aggregate(Price with sum as sum))&$filter=sum gt 0', url);
    };
    QueryTests.prototype.applyGroupByAggregateFilterOrdinal = function () {
        var url = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(function (i) { return i.Price; })
                };
            }).filter(function (g) { return g.orderId == 2 && g.sum >= 4; }).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId),aggregate(Price with sum as sum))&$filter=OrderId eq 2 and sum ge 4', url);
        var scope = { orderId: 2, sum: 4 };
        var url2 = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(function (i) { return i.Price; })
                };
            }).filter(function (g) { return g.orderId == scope.orderId && g.sum >= scope.sum; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.applyGroupByAggregateOrderBy = function () {
        var url = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(function (i) { return i.Price; })
                };
            }).orderby(function (g) { return g.sum; }).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId),aggregate(Price with sum as sum))&$orderby=sum', url);
    };
    QueryTests.prototype.applyGroupByFilter = function () {
        var url = this.context.OrderItems.filter(function (i) { return i.OrderId == 1 && i.Order.Name == 'Order 1'; })
            .groupby(function (i) { return { orderId: i.OrderId, name: i.Order.Name }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    orderName: g.key.name
                };
            }).getQueryUrl();
        this.equal("OrderItems?$apply=filter(OrderId eq 1 and Order/Name eq 'Order 1')/groupby((OrderId,Order/Name))", url);
        var scope = { orderName: 'Order 1' };
        var url2 = this.context.OrderItems.filter(function (i) { return i.OrderId == 1 && i.Order.Name == scope.orderName; }, scope)
            .groupby(function (i) { return { orderId: i.OrderId, name: i.Order.Name }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    orderName: g.key.name
                };
            }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.applyGroupByMul = function () {
        var url = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(function (i) { return i.Price * i.Count; })
                };
            }).orderby(function (g) { return g.orderId; }).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId),aggregate(Price mul Count with sum as sum))&$orderby=OrderId', url);
    };
    QueryTests.prototype.applyGroupByOrderBy = function () {
        var url = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId, name: i.Order.Name }; })
            .orderbyDescending(function (g) { return g.key.orderId; }).orderby(function (g) { return g.key.name; }).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId,Order/Name))&$orderby=OrderId desc,Order/Name', url);
    };
    QueryTests.prototype.applyGroupByOrderBySkipTop = function () {
        var url = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId, name: i.Order.Name }; })
            .orderbyDescending(function (g) { return g.key.orderId; }).orderby(function (g) { return g.key.name; }).skip(1).top(1).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId,Order/Name))&$orderby=OrderId desc,Order/Name&$skip=1&$top=1', url);
    };
    QueryTests.prototype.applyGroupBySkip = function () {
        var url = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId }; })
            .orderby(function (g) { return g.key.orderId; }).skip(1).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId))&$orderby=OrderId&$skip=1', url);
    };
    QueryTests.prototype.applyGroupByTop = function () {
        var url = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId }; })
            .orderby(function (g) { return g.key.orderId; }).top(1).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId))&$orderby=OrderId&$top=1', url);
    };
    QueryTests.prototype.applyGroupByVirtualCount = function () {
        var url = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    dcnt: g.countdistinct(function (i) { return i.Product.substring(0, 10); }),
                    cnt: g.count()
                };
            }).filter(function (g) { return g.dcnt != g.cnt; }).orderby(function (g) { return g.orderId; }).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId),aggregate(substring(Product,0,10) with countdistinct as dcnt,$count as cnt))&$filter=dcnt ne cnt&$orderby=OrderId', url);
        var scope = { pos1: 0, pos2: 10 };
        var url2 = this.context.OrderItems
            .groupby(function (i) { return { orderId: i.OrderId }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    dcnt: g.countdistinct(function (i) { return i.Product.substring(scope.pos1, scope.pos2); }),
                    cnt: g.count()
                };
            }, scope).filter(function (g) { return g.dcnt != g.cnt; }).orderby(function (g) { return g.orderId; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.compute = function () {
        var url = this.context.OrderItems
            .expand(function (i) { return i.Order; })
            .select(function (i) {
                return {
                    product: i.Product,
                    Total: i.Count * i.Price,
                    SumId: i.Id + i.OrderId
                };
            }).getQueryUrl();
        this.equal('OrderItems?$expand=Order&$select=Product&$compute=Count mul Price as Total,Id add OrderId as SumId', url);
    };
    QueryTests.prototype.count = function () {
        //not applicable
        //let count = await this.context.Orders.count();
        //return count;
    };
    QueryTests.prototype.dbQuery = function () {
        var url = this.context.OrderItemsView.orderby(function (i) { return i.Name; }).orderby(function (i) { return i.Product; }).getQueryUrl();
        this.equal('OrderItemsView?$orderby=Name,Product', url);
    };
    QueryTests.prototype.expand = function () {
        var url = this.context.Orders
            .expand(function (o) { return o.Customer; })
            .expand(function (o) { return o.Items; })
            .orderby(function (o) { return o.Id; }).getQueryUrl();
        this.equal('Orders?$expand=Customer,Items&$orderby=Id', url);
    };
    QueryTests.prototype.expandCollectionSingleSelectNestedName = function () {
        var url = this.context.Customers
            .expand(function (c) { return c.CustomerShippingAddresses; }).thenExpand(function (c) { return c.ShippingAddress; }).thenSelect(function (csa) { return { p: csa.Address }; })
            .asEntitySet().orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).select(function (c) { return { p: c.Name }; }).getQueryUrl();
        this.equal('Customers?$expand=CustomerShippingAddresses($expand=ShippingAddress($select=Address))&$select=Name&$orderby=Country,Id', url);
    };
    QueryTests.prototype.expandManyToMany = function () {
        var url = this.context.Customers
            .expand(function (c) { return c.AltOrders; })
            .expand(function (c) { return c.ShippingAddresses; })
            .expand(function (c) { return c.Orders; })
            .orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$expand=AltOrders,ShippingAddresses,Orders&$orderby=Country,Id', url);
    };
    QueryTests.prototype.expandAndSelect = function () {
        var url = this.context.Orders
            .expand(function (o) { return o.AltCustomer; })
            .expand(function (o) { return o.Customer; })
            .expand(function (o) { return o.Items; }).thenOrderby(function (i) { return i.Id; })
            .expand(function (o) { return o.ShippingAddresses; }).thenOrderby(function (i) { return i.Id; })
            .select(function (o) {
                return {
                    p1: o.AltCustomerCountry,
                    p2: o.AltCustomerId,
                    p3: o.CustomerCountry,
                    p4: o.CustomerId,
                    p5: o.Date,
                    p6: o.Id,
                    p7: o.Name,
                    p8: o.Status
                };
            }).orderby(function (o) { return o.p6; }).getQueryUrl();
        this.equal('Orders?$expand=AltCustomer,Customer,Items($orderby=Id),ShippingAddresses($orderby=Id)&$select=AltCustomerCountry,AltCustomerId,CustomerCountry,CustomerId,Date,Id,Name,Status&$orderby=Id', url);
    };
    QueryTests.prototype.expandExpandFilter = function () {
        var url = this.context.Customers
            .expand(function (c) { return c.AltOrders; }).thenExpand(function (o) { return o.Items; }).thenFilter(function (i) { return i.Product.includes('unknown'); }).thenOrderby(function (i) { return i.Id; })
            .expand(function (c) { return c.Orders; }).thenExpand(function (o) { return o.Items; }).thenFilter(function (i) { return i.Product.includes('unknown'); }).thenOrderby(function (i) { return i.Id; })
            .orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$expand=AltOrders($expand=Items($filter=contains(Product,\'unknown\');$orderby=Id)),Orders($expand=Items($filter=contains(Product,\'unknown\');$orderby=Id))&$orderby=Country,Id', url);
        var product = 'unknown';
        var url2 = this.context.Customers
            .expand(function (c) { return c.AltOrders; }).thenExpand(function (o) { return o.Items; }).thenFilter(function (i) { return i.Product.includes(product); }, { product: product }).thenOrderby(function (i) { return i.Id; })
            .expand(function (c) { return c.Orders; }).thenExpand(function (o) { return o.Items; }).thenFilter(function (i) { return i.Product.includes(product); }, { product: product }).thenOrderby(function (i) { return i.Id; })
            .orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.expandExpandMany = function () {
        var url = this.context.Customers
            .expand(function (c) { return c.AltOrders; }).thenExpand(function (o) { return o.Items; }).thenOrderbyDescending(function (i) { return i.Price; })
            .expand(function (c) { return c.AltOrders; }).thenExpand(function (o) { return o.ShippingAddresses; }).thenOrderbyDescending(function (s) { return s.Id; })
            .expand(function (c) { return c.Orders; }).thenExpand(function (o) { return o.Items; }).thenOrderbyDescending(function (i) { return i.Price; })
            .expand(function (c) { return c.Orders; }).thenExpand(function (o) { return o.ShippingAddresses; }).thenOrderbyDescending(function (s) { return s.Id; })
            .orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$expand=AltOrders($expand=Items($orderby=Price desc),ShippingAddresses($orderby=Id desc)),Orders($expand=Items($orderby=Price desc),ShippingAddresses($orderby=Id desc))&$orderby=Country,Id', url);
    };
    QueryTests.prototype.expandExpandOne = function () {
        var url = this.context.OrderItems
            .expand(function (i) { return i.Order; }).thenExpand(function (o) { return o.AltCustomer; })
            .expand(function (i) { return i.Order; }).thenExpand(function (o) { return o.Customer; }).orderby(function (i) { return i.Id; }).getQueryUrl();
        this.equal('OrderItems?$expand=Order($expand=AltCustomer,Customer)&$orderby=Id', url);
    };
    QueryTests.prototype.expandExpandOrderBy = function () {
        var url = this.context.Customers
            .expand(function (c) { return c.Orders; }).thenExpand(function (o) { return o.Items; }).thenOrderbyDescending(function (i) { return i.Id; })
            .orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$expand=Orders($expand=Items($orderby=Id desc))&$orderby=Country,Id', url);
    };
    QueryTests.prototype.expandExpandSkipTop = function () {
        var url = this.context.Customers
            .expand(function (c) { return c.AltOrders; }).thenExpand(function (o) { return o.Items; }).thenOrderby(function (i) { return i.Id; }).thenTop(1)
            .expand(function (c) { return c.Orders; }).thenExpand(function (o) { return o.Items; }).thenOrderby(function (i) { return i.Id; }).thenTop(1)
            .orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).skip(1).top(3).getQueryUrl();
        this.equal('Customers?$expand=AltOrders($expand=Items($orderby=Id;$top=1)),Orders($expand=Items($orderby=Id;$top=1))&$orderby=Country,Id&$skip=1&$top=3', url);
    };
    QueryTests.prototype.expandInverseProperty = function () {
        var url = this.context.Customers
            .expand(function (c) { return c.AltOrders; })
            .expand(function (c) { return c.Orders; })
            .orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$expand=AltOrders,Orders&$orderby=Country,Id', url);
    };
    QueryTests.prototype.expandManyFilter = function () {
        var url = this.context.Customers
            .expand(function (c) { return c.Orders; }).thenFilter(function (o) { return o.Status === oe.OrderStatus.Processing; })
            .orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$expand=Orders($filter=Status eq OdataToEntity.Test.Model.OrderStatus\'Processing\')&$orderby=Country,Id', url);
        var orderStatus;
        var url2 = this.context.Customers
            .expand(function (c) { return c.Orders; }).thenFilter(function (o) { return o.Status === orderStatus; }, { orderStatus: this.odataNamespace + '.OrderStatus\'Processing\'' })
            .orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.expandNestedSelect = function () {
        var url = this.context.Customers
            .expand(function (c) { return c.Orders; }).thenSelect(function (o) {
                return {
                    p1: o.AltCustomerCountry,
                    p2: o.AltCustomerId,
                    p3: o.CustomerCountry,
                    p4: o.CustomerId,
                    p5: o.Date,
                    p6: o.Id,
                    p7: o.Name,
                    p8: o.Status
                };
            }).asEntitySet().orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$expand=Orders($select=AltCustomerCountry,AltCustomerId,CustomerCountry,CustomerId,Date,Id,Name,Status)&$orderby=Country,Id', url);
    };
    QueryTests.prototype.expandNullableNestedSelect = function () {
        var url = this.context.Orders
            .expand(function (o) { return o.AltCustomer; }).thenSelect(function (o) {
                return {
                    p1: o.Address,
                    p2: o.Country,
                    p3: o.Id,
                    p4: o.Name,
                    p5: o.Sex
                };
            }).asEntitySet().orderby(function (o) { return o.Id; }).getQueryUrl();
        this.equal('Orders?$expand=AltCustomer($select=Address,Country,Id,Name,Sex)&$orderby=Id', url);
    };
    QueryTests.prototype.expandOneFilter = function () {
        var url = this.context.Orders
            .expand(function (o) { return o.AltCustomer; }).thenFilter(function (c) { return c.Sex === oe.Sex.Male; })
            .getQueryUrl();
        this.equal("Orders?$expand=AltCustomer($filter=Sex eq OdataToEntity.Test.Model.Sex'Male')", url);
        var sex = oe.Sex.Male;
        var url2 = this.context.Orders
            .expand(function (o) { return o.AltCustomer; }).thenFilter(function (c) { return c.Sex === sex; }, { sex: this.odataNamespace + '.Sex\'Male\'' })
            .getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.expandStar = function () {
        //not applicable
    };
    QueryTests.prototype.filterAll = function () {
        var url = this.context.Orders.filter(function (o) { return o.Items.every(function (i) { return i.Price >= 2.1; }); }).getQueryUrl();
        this.equal('Orders?$filter=Items/all(d:d/Price ge 2.1)', url);
        var price = 2.1;
        var url2 = this.context.Orders.filter(function (o) { return o.Items.every(function (i) { return i.Price >= price; }); }, { price: price }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterAndHaving = function () {
        var url = this.context.OrderItems.filter(function (i) { return i.Order.CustomerCountry != 'UN'; })
            .groupby(function (i) { return { orderId: i.OrderId }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(function (i) { return i.Price * i.Count; })
                };
            }).filter(function (g) { return g.sum > 7; }).getQueryUrl();
        this.equal("OrderItems?$apply=filter(Order/CustomerCountry ne 'UN')/groupby((OrderId),aggregate(Price mul Count with sum as sum))&$filter=sum gt 7", url);
        var customerCountry = 'UN';
        var sum = 7;
        var scope = { customerCountry: customerCountry, sum: sum };
        var url2 = this.context.OrderItems.filter(function (i) { return i.Order.CustomerCountry != customerCountry; }, scope)
            .groupby(function (i) { return { orderId: i.OrderId }; }).select(function (g) {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(function (i) { return i.Price * i.Count; })
                };
            }).filter(function (g) { return g.sum > sum; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterAny = function () {
        var url = this.context.Orders.filter(function (o) { return o.Items.some(function (i) { return i.Count > 2; }); }).getQueryUrl();
        this.equal('Orders?$filter=Items/any(d:d/Count gt 2)', url);
        var count = 2;
        var url2 = this.context.Orders.filter(function (o) { return o.Items.some(function (i) { return i.Count > count; }); }, { count: count }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterCount = function () {
        var url = this.context.Orders.filter(function (o) { return OdataFunctions_1.OdataFunctions.arrayLength(o.Items) > 2; }).getQueryUrl();
        this.equal('Orders?$filter=Items/$count gt 2', url);
        var length = 2;
        var url2 = this.context.Orders.filter(function (o) { return OdataFunctions_1.OdataFunctions.arrayLength(o.Items) > length; }, { length: length }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterDateTime = function () {
        var dt = new Date('2016-07-04T19:10:10.8237573+03:00');
        var url = this.context.Categories.filter(function (o) { return o.DateTime >= dt; }, { dt: dt }).getQueryUrl();
        this.equal('Categories?$filter=DateTime ge 2016-07-04T16:10:10.823Z', url);
    };
    QueryTests.prototype.filterDateTimeNull = function () {
        var url = this.context.Categories.filter(function (o) { return o.DateTime === null; }).getQueryUrl();
        this.equal('Categories?$filter=DateTime eq null', url);
        var dt = null;
        var url2 = this.context.Categories.filter(function (o) { return o.DateTime === dt; }, { dt: dt }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterDateTimeOffset = function () {
        var url = this.context.Orders.filter(function (o) { return o.Date >= new Date('2016-07-04T19:10:10.8237573+03:00'); }).getQueryUrl();
        this.equal('Orders?$filter=Date ge 2016-07-04T16:10:10.823Z', url);
    };
    QueryTests.prototype.filterDateTimeOffsetNull = function () {
        var url = this.context.Orders.filter(function (o) { return o.Date == null; }).getQueryUrl();
        this.equal('Orders?$filter=Date eq null', url);
    };
    QueryTests.prototype.filterDateTimeOffsetYearMonthDay = function () {
        var url = this.context.Orders.filter(function (o) { return o.Date.getFullYear() === 2016 && o.Date.getMonth() > 3 && o.Date.getDay() < 20; }).getQueryUrl();
        this.equal('Orders?$filter=year(Date) eq 2016 and month(Date) gt 3 and day(Date) lt 20', url);
        var scope = { year: 2016, month: 3, day: 20 };
        var url2 = this.context.Orders.filter(function (o) { return o.Date.getFullYear() === scope.year && o.Date.getMonth() > scope.month && o.Date.getDay() < scope.day; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterDateTimeYearMonthDay = function () {
        var url = this.context.Categories.filter(function (c) { return c.DateTime.getFullYear() === 2016 && c.DateTime.getMonth() > 3 && c.DateTime.getDay() < 20; }).getQueryUrl();
        this.equal('Categories?$filter=year(DateTime) eq 2016 and month(DateTime) gt 3 and day(DateTime) lt 20', url);
        var scope = { year: 2016, month: 3, day: 20 };
        var url2 = this.context.Categories.filter(function (c) { return c.DateTime.getFullYear() === scope.year && c.DateTime.getMonth() > scope.month && c.DateTime.getDay() < scope.day; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterDecimal = function () {
        var url = this.context.OrderItems.filter(function (i) { return i.Price > 2; }).getQueryUrl();
        this.equal('OrderItems?$filter=Price gt 2', url);
        var price = 2;
        var url2 = this.context.OrderItems.filter(function (i) { return i.Price > price; }, { price: price }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterDecimalNull = function () {
        var url = this.context.OrderItems.filter(function (i) { return i.Price == null; }).getQueryUrl();
        this.equal('OrderItems?$filter=Price eq null', url);
        var price = null;
        var url2 = this.context.OrderItems.filter(function (i) { return i.Price == price; }, { price: price }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterEnum = function () {
        var url = this.context.Customers.filter(function (c) { return c.Sex == oe.Sex.Female; }).getQueryUrl();
        this.equal('Customers?$filter=Sex eq OdataToEntity.Test.Model.Sex\'Female\'', url);
        var scope = { sex: 'OdataToEntity.Test.Model.Sex\'Female\'' };
        var url2 = this.context.Customers.filter(function (c) { return c.Sex == scope.sex; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.FilterEnumGe = function () {
        var url = this.context.Orders.filter(function (o) { return o.Status >= oe.OrderStatus.Unknown; }).orderby(function (o) { return o.Id; }).getQueryUrl();
        this.equal('Orders?$filter=Status ge OdataToEntity.Test.Model.OrderStatus\'Unknown\'&$orderby=Id', url);
        var scope = { status: 'OdataToEntity.Test.Model.OrderStatus\'Unknown\'' };
        var url2 = this.context.Orders.filter(function (o) { return o.Status >= scope.status; }, scope).orderby(function (o) { return o.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterEnumLt = function () {
        var url = this.context.Orders.filter(function (o) { return oe.OrderStatus.Unknown < o.Status; }).getQueryUrl();
        this.equal('Orders?$filter=OdataToEntity.Test.Model.OrderStatus\'Unknown\' lt Status', url);
        var scope = { status: 'OdataToEntity.Test.Model.OrderStatus\'Unknown\'' };
        var url2 = this.context.Orders.filter(function (o) { return scope.status < o.Status; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterEnumNull = function () {
        var url = this.context.Customers.filter(function (c) { return c.Sex != null && c.Address != null; }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$filter=Sex ne null and Address ne null&$orderby=Country,Id', url);
        var scope = { sex: null, address: null };
        var url2 = this.context.Customers.filter(function (c) { return c.Sex != scope.sex && c.Address != scope.address; }, scope).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterEnumNullableGe = function () {
        var url = this.context.Customers.filter(function (c) { return c.Sex >= oe.Sex.Male; }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$filter=Sex ge OdataToEntity.Test.Model.Sex\'Male\'&$orderby=Country,Id', url);
        var scope = { sex: 'OdataToEntity.Test.Model.Sex\'Male\'' };
        var url2 = this.context.Customers.filter(function (c) { return c.Sex >= scope.sex; }, scope).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterEnumNullableLt = function () {
        var url = this.context.Customers.filter(function (c) { return oe.Sex.Male < c.Sex; }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$filter=OdataToEntity.Test.Model.Sex\'Male\' lt Sex&$orderby=Country,Id', url);
        var scope = { sex: 'OdataToEntity.Test.Model.Sex\'Male\'' };
        var url2 = this.context.Customers.filter(function (c) { return scope.sex < c.Sex; }, scope).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterEnumNotNullAndStringNotNull = function () {
        var url = this.context.Customers.filter(function (c) { return c.Sex == null && c.Address != null; }).getQueryUrl();
        this.equal('Customers?$filter=Sex eq null and Address ne null', url);
        var scope = { sex: null, address: null };
        var url2 = this.context.Customers.filter(function (c) { return c.Sex == scope.sex && c.Address != scope.address; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterEnumNullAndStringNull = function () {
        var url = this.context.Customers.filter(function (c) { return c.Sex == null && c.Address == null; }).getQueryUrl();
        this.equal('Customers?$filter=Sex eq null and Address eq null', url);
        var scope = { sex: null, address: null };
        var url2 = this.context.Customers.filter(function (c) { return c.Sex == scope.sex && c.Address == scope.address; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterIn = function () {
        var url = this.context.OrderItems.filter(function (i) { return [1.1, 1.2, 1.3].includes(i.Price); }).orderby(function (i) { return i.Id; }).getQueryUrl();
        this.equal('OrderItems?$filter=Price in (1.1,1.2,1.3)&$orderby=Id', url);
        var items = [1.1, 1.2, 1.3];
        var url2 = this.context.OrderItems.filter(function (i) { return items.includes(i.Price); }, { items: items }).orderby(function (i) { return i.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterInEnum = function () {
        var url = this.context.Customers.filter(function (c) { return [oe.Sex.Male, oe.Sex.Female].includes(c.Sex); }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal('Customers?$filter=Sex in (OdataToEntity.Test.Model.Sex\'Male\',OdataToEntity.Test.Model.Sex\'Female\')&$orderby=Country,Id', url);
        var scope = { items: ['OdataToEntity.Test.Model.Sex\'Male\'', 'OdataToEntity.Test.Model.Sex\'Female\''] };
        var url2 = this.context.Customers.filter(function (c) { return scope.items.includes(c.Sex); }, scope).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterInt = function () {
        var url = this.context.OrderItems.filter(function (i) { return i.Count >= 2; }).getQueryUrl();
        this.equal('OrderItems?$filter=Count ge 2', url);
        var scope = { count: 2 };
        var url2 = this.context.OrderItems.filter(function (i) { return i.Count >= scope.count; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterIntNull = function () {
        var url = this.context.OrderItems.filter(function (i) { return i.Count === null; }).getQueryUrl();
        this.equal('OrderItems?$filter=Count eq null', url);
        var count = null;
        var url2 = this.context.OrderItems.filter(function (i) { return i.Count == count; }, { count: count }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterNavigation = function () {
        var url = this.context.OrderItems.filter(function (i) { return i.Order.Customer.Name == 'Ivan'; }).getQueryUrl();
        this.equal('OrderItems?$filter=Order/Customer/Name eq \'Ivan\'', url);
        var scope = { name: 'Ivan' };
        var url2 = this.context.OrderItems.filter(function (i) { return i.Order.Customer.Name == scope.name; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterSegment = function () {
        //not supported
    };
    QueryTests.prototype.filterStringConcat = function () {
        var url = this.context.Customers.filter(function (c) { return c.Name.concat(' hello', ' world') == 'Ivan hello world'; }).getQueryUrl();
        this.equal("Customers?$filter=concat(concat(Name,' hello'),' world') eq 'Ivan hello world'", url);
        var scope = { str1: ' hello', str2: ' world' };
        var url2 = this.context.Customers.filter(function (c) { return c.Name.concat(scope.str1, scope.str2) == 'Ivan hello world'; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringEq = function () {
        var url = this.context.Customers.filter(function (c) { return c.Address == 'Tula'; }).getQueryUrl();
        this.equal("Customers?$filter=Address eq 'Tula'", url);
        var address = 'Tula';
        var url2 = this.context.Customers.filter(function (c) { return c.Address == address; }, { address: address }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringGe = function () {
        var url = this.context.Customers.filter(function (c) { return c.Address >= 'Tula'; }).getQueryUrl();
        this.equal("Customers?$filter=Address ge 'Tula'", url);
        var address = 'Tula';
        var url2 = this.context.Customers.filter(function (c) { return c.Address >= address; }, { address: address }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringGt = function () {
        var url = this.context.Customers.filter(function (c) { return c.Address > 'Tula'; }).getQueryUrl();
        this.equal("Customers?$filter=Address gt 'Tula'", url);
        var address = 'Tula';
        var url2 = this.context.Customers.filter(function (c) { return c.Address > address; }, { address: address }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringLe = function () {
        var url = this.context.Customers.filter(function (c) { return c.Address <= 'Tula'; }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal("Customers?$filter=Address le 'Tula'&$orderby=Country,Id", url);
        var address = 'Tula';
        var url2 = this.context.Customers.filter(function (c) { return c.Address <= address; }, { address: address }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringLt = function () {
        var url = this.context.Customers.filter(function (c) { return c.Address < 'Tula'; }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal("Customers?$filter=Address lt 'Tula'&$orderby=Country,Id", url);
        var address = 'Tula';
        var url2 = this.context.Customers.filter(function (c) { return c.Address < address; }, { address: address }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringNe = function () {
        var url = this.context.Customers.filter(function (c) { return c.Address != 'Tula'; }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal("Customers?$filter=Address ne 'Tula'&$orderby=Country,Id", url);
        var address = 'Tula';
        var url2 = this.context.Customers.filter(function (c) { return c.Address != address; }, { address: address }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringEndsWith = function () {
        var url = this.context.Customers.filter(function (c) { return c.Name.endsWith('asha'); }).getQueryUrl();
        this.equal("Customers?$filter=endswith(Name,'asha')", url);
        var str = 'asha';
        var url2 = this.context.Customers.filter(function (c) { return c.Name.endsWith(str); }, { str: str }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringLength = function () {
        var url = this.context.Customers.filter(function (c) { return OdataFunctions_1.OdataFunctions.stringLength(c.Name) == 5; }).getQueryUrl();
        this.equal('Customers?$filter=length(Name) eq 5', url);
        var length = 5;
        var url2 = this.context.Customers.filter(function (c) { return OdataFunctions_1.OdataFunctions.stringLength(c.Name) == length; }, { length: length }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringIndexOf = function () {
        var url = this.context.Customers.filter(function (c) { return c.Name.indexOf('asha') == 1; }).getQueryUrl();
        this.equal("Customers?$filter=indexof(Name,'asha') eq 1", url);
        var pos = 1;
        var url2 = this.context.Customers.filter(function (c) { return c.Name.indexOf('asha') == pos; }, { pos: pos }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringStartsWith = function () {
        var url = this.context.Customers.filter(function (c) { return c.Name.startsWith('S'); }).getQueryUrl();
        this.equal("Customers?$filter=startswith(Name,'S')", url);
        var str = 'S';
        var url2 = this.context.Customers.filter(function (c) { return c.Name.startsWith(str); }, { str: str }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringSubstring = function () {
        var url = this.context.Customers.filter(function (c) { return c.Name.substring(1, 1) == c.Name.substring(4, 1); }).getQueryUrl();
        this.equal('Customers?$filter=substring(Name,1,1) eq substring(Name,4,1)', url);
        var pos1 = 1;
        var pos2 = 1;
        var pos3 = 4;
        var pos4 = 1;
        var scope = { pos1: pos1, pos2: pos2, pos3: pos3, pos4: pos4 };
        var url2 = this.context.Customers.filter(function (c) { return c.Name.substring(pos1, pos2) == c.Name.substring(pos3, pos4); }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringToLower = function () {
        var url = this.context.Customers.filter(function (c) { return c.Name.toLowerCase() == 'sasha'; }).getQueryUrl();
        this.equal("Customers?$filter=tolower(Name) eq 'sasha'", url);
        var name = 'sasha';
        var url2 = this.context.Customers.filter(function (c) { return c.Name.toLowerCase() == name; }, { name: name }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringToUpper = function () {
        var url = this.context.Customers.filter(function (c) { return c.Name.toUpperCase() == 'SASHA'; }).getQueryUrl();
        this.equal("Customers?$filter=toupper(Name) eq 'SASHA'", url);
        var name = 'SASHA';
        var url2 = this.context.Customers.filter(function (c) { return c.Name.toUpperCase() == name; }, { name: name }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.filterStringTrim = function () {
        var url = this.context.Customers.filter(function (c) { return c.Name.concat(' ').trim() == c.Name.trim(); }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equal("Customers?$filter=trim(concat(Name,' ')) eq trim(Name)&$orderby=Country,Id", url);
        var space = ' ';
        var url2 = this.context.Customers.filter(function (c) { return c.Name.concat(space).trim() == c.Name.trim(); }, { space: space }).orderby(function (c) { return c.Country; }).orderby(function (c) { return c.Id; }).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.keyComposition = function () {
        var url = this.context.Customers.key({ Country: 'RU', Id: 1 }).getQueryUrl();
        this.equal("Customers(Country='RU',Id=1)", url);
    };
    QueryTests.prototype.keyExpand = function () {
        var url = this.context.Orders.key(1)
            .expand(function (o) { return o.Customer; })
            .expand(function (o) { return o.Items; })
            .getQueryUrl();
        this.equal('Orders(1)?$expand=Customer,Items', url);
    };
    QueryTests.prototype.keyFilter = function () {
        var url = this.context.Orders.key(1, function (o) { return o.Items; }).filter(function (i) { return i.Count >= 2; }).getQueryUrl();
        this.equal('Orders(1)/Items?$filter=Count ge 2', url);
        var scope = { id: 1, count: 2 };
        var url2 = this.context.Orders.key(scope.id, function (o) { return o.Items; }).filter(function (i) { return i.Count >= scope.count; }, scope).getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.keyMultipleNavigationOne = function () {
        var url = this.context.OrderItems.key(1, function (i) { return i.Order.Customer; }).getQueryUrl();
        this.equal('OrderItems(1)/Order/Customer', url);
    };
    QueryTests.prototype.keyNavigationGroupBy = function () {
    };
    QueryTests.prototype.keyOrderBy = function () {
        var url = this.context.Orders.key(1, function (o) { return o.Items; }).orderby(function (i) { return i.Count; }).orderby(function (i) { return i.Price; }).getQueryUrl();
        this.equal('Orders(1)/Items?$orderby=Count,Price', url);
    };
    QueryTests.prototype.mathFunctions = function () {
        var url = this.context.OrderItems
            .select(function (i) {
                return {
                    Price: i.Price,
                    Ceiling: Math.ceil(i.Price),
                    Floor: Math.floor(i.Price),
                    Round: Math.round(i.Price)
                };
            }).orderby(function (g) { return g.Price; }).getQueryUrl();
        this.equal('OrderItems?$select=Price&$compute=ceiling(Price) as Ceiling,floor(Price) as Floor,round(Price) as Round&$orderby=Price', url);
    };
    QueryTests.prototype.orderByColumnsMissingInSelect = function () {
        var url = this.context.OrderItems.orderbyDescending(function (i) { return i.Count; }).orderby(function (i) { return i.Order.Customer.Name; }).orderbyDescending(function (i) { return i.Id; })
            .select(function (i) {
                return {
                    p1: i.Product,
                    p2: i.Id
                };
            }).getQueryUrl();
        this.equal('OrderItems?$select=Product,Id&$orderby=Count desc,Order/Customer/Name,Id desc', url);
    };
    QueryTests.prototype.orderByColumnsMissingInSelectNavigationFirst = function () {
        var url = this.context.OrderItems.orderbyDescending(function (i) { return i.Order.Customer.Name; }).orderby(function (i) { return i.Count; }).orderbyDescending(function (i) { return i.Id; })
            .select(function (i) {
                return {
                    p1: i.Product,
                    p2: i.Id
                };
            }).getQueryUrl();
        this.equal('OrderItems?$select=Product,Id&$orderby=Order/Customer/Name desc,Count,Id desc', url);
    };
    QueryTests.prototype.orderByDesc = function () {
        var url = this.context.OrderItems.orderbyDescending(function (i) { return i.Id; }).orderbyDescending(function (i) { return i.Count; }).orderbyDescending(function (i) { return i.Price; }).getQueryUrl();
        this.equal('OrderItems?$orderby=Id desc,Count desc,Price desc', url);
    };
    QueryTests.prototype.orderByNavigation = function () {
        var url = this.context.OrderItems.orderbyDescending(function (i) { return i.Order.Customer.Sex; }).orderby(function (i) { return i.Order.Customer.Name; }).orderbyDescending(function (i) { return i.Id; }).getQueryUrl();
        this.equal('OrderItems?$orderby=Order/Customer/Sex desc,Order/Customer/Name,Id desc', url);
    };
    QueryTests.prototype.parameterization = function () {
        var url = this.context.Orders
            .filter(function (o) { return o.AltCustomerId == 3 && o.CustomerId == 4 && (o.Date.getFullYear() == 2016 && o.Date.getMonth() > 11 && o.Date.getDay() < 20 || o.Date == null) && o.Name.includes('unknown') && o.Status == oe.OrderStatus.Unknown; })
            .expand(function (o) { return o.Items; }).thenFilter(function (i) { return (i.Count == 0 || i.Count == null) && (i.Price == 0 || i.Price == null) && (i.Product.includes('unknown') || i.Product.includes('null')) && i.OrderId > -1 && i.Id != 1; })
            .getQueryUrl();
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
            id: 1
        };
        var url2 = this.context.Orders
            .filter(function (o) { return o.AltCustomerId == s.altCustomerId && o.CustomerId == s.customerId && (o.Date.getFullYear() == s.dateYear && o.Date.getMonth() > s.dateMonth && o.Date.getDay() < s.dateDay || o.Date == s.date) && o.Name.includes(s.name) && o.Status == s.status; }, s)
            .expand(function (o) { return o.Items; }).thenFilter(function (i) { return (i.Count == s.count1 || i.Count == s.count2) && (i.Price == s.price1 || i.Price == s.price2) && (i.Product.includes(s.product1) || i.Product.includes(s.product2)) && i.OrderId > s.orderId && i.Id != s.id; }, s)
            .getQueryUrl();
        this.equalUrl(url, url2);
    };
    QueryTests.prototype.referencedModels = function () {
        //not applicable
    };
    QueryTests.prototype.select = function () {
        var url = this.context.Orders.select(function (o) {
            return {
                p01: o.AltCustomer,
                p02: o.AltCustomerCountry,
                p03: o.AltCustomerId,
                p05: o.Customer,
                p04: o.CustomerCountry,
                p06: o.CustomerId,
                p07: o.Date,
                p08: o.Id,
                p09: o.Items,
                p10: o.Name,
                p11: o.ShippingAddresses,
                p12: o.Status
            };
        }).orderby(function (o) { return o.p08; }).getQueryUrl();
        this.equal('Orders?$select=AltCustomer,AltCustomerCountry,AltCustomerId,Customer,CustomerCountry,CustomerId,Date,Id,Items,Name,ShippingAddresses,Status&$orderby=Id', url);
    };
    QueryTests.prototype.selectName = function () {
        var url = this.context.Orders.select(function (o) { return { p: o.Name }; }).getQueryUrl();
        this.equal('Orders?$select=Name', url);
    };
    QueryTests.prototype.selectNestedName = function () {
        var url = this.context.Orders
            .expand(function (o) { return o.Items; }).thenFilter(function (i) { return i.OrderId == 1; }).thenSelect(function (o) { return { p: o.Product }; })
            .asEntitySet().select(function (o) { return { p: o.Name }; }).getQueryUrl();
        this.equal('Orders?$expand=Items($filter=OrderId eq 1;$select=Product)&$select=Name', url);
    };
    QueryTests.prototype.table = function () {
        var url = this.context.Orders.orderby(function (o) { return o.Id; }).getQueryUrl();
        this.equal('Orders?$orderby=Id', url);
    };
    QueryTests.prototype.timeDateTimeFunction = function () {
        var url = this.context.Categories
            .select(function (c) {
                return {
                    DateTime: c.DateTime,
                    Hour: c.DateTime.getHours(),
                    Minute: c.DateTime.getMinutes(),
                    Second: c.DateTime.getSeconds()
                };
            }).orderby(function (c) { return c.DateTime; }).getQueryUrl();
        this.equal('Categories?$select=DateTime&$compute=hour(DateTime) as Hour,minute(DateTime) as Minute,second(DateTime) as Second&$orderby=DateTime', url);
    };
    QueryTests.prototype.timeDateTimeOffsetFunction = function () {
        var url = this.context.Orders
            .select(function (o) {
                return {
                    Date: o.Date,
                    Hour: o.Date.getHours(),
                    Minute: o.Date.getMinutes(),
                    Second: o.Date.getSeconds()
                };
            }).orderby(function (o) { return o.Date; }).getQueryUrl();
        this.equal('Orders?$select=Date&$compute=hour(Date) as Hour,minute(Date) as Minute,second(Date) as Second&$orderby=Date', url);
    };
    QueryTests.prototype.topSkip = function () {
        var url = this.context.Customers.orderby(function (o) { return o.Id; }).skip(2).top(3).getQueryUrl();
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
                "Content-Type": "application/json"
            }),
            method: "GET"
        });
        cross_fetch_1.fetch(request).then(function (r) { return r.text().then(function (t) { return console.log(t); }); });
    };
    return QueryTests;
}());
exports.QueryTests = QueryTests;
//# sourceMappingURL=QueryTests.js.map