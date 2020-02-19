import { Request, Headers, fetch } from 'cross-fetch';
import { OdataContext } from '../source/OdataContext';
import { OdataFunctions } from '../source/OdataFunctions';
import { OdataParser } from '../source/OdataParser';

import { OrderContext } from './OrderContext';
import * as oe from './order';

export class QueryTests {
    private readonly baseUri: string;
    private readonly context: OrderContext;
    private readonly odataNamespace = 'OdataToEntity.Test.Model';

    constructor(baseUri: string, odataParser?: OdataParser) {
        this.baseUri = baseUri;
        this.context = OdataContext.create(OrderContext, baseUri, this.odataNamespace, odataParser);
    }

    applyFilter(): void {
        //not applicable
    }
    applyFilterGroupBy(): void {
        let url: URL = this.context.Orders.filter(o => o.Status == oe.OrderStatus.Unknown)
            .groupby(o => { return { Name: o.Name } }).select(g => {
                return {
                    cnt: g.countdistinct(o => o.Id)
                }
            }).getQueryUrl();
        this.equal("Orders?$apply=filter(Status eq OdataToEntity.Test.Model.OrderStatus'Unknown')/groupby((Name),aggregate(Id with countdistinct as cnt))", url);

        let scope = { orderStatus: this.odataNamespace + '.OrderStatus' + "'" + oe.OrderStatus.Unknown + "'"}
        let url2: URL = this.context.Orders.filter(o => o.Status == scope.orderStatus, scope)
            .groupby(o => { return { Name: o.Name } }).select(g => {
                return {
                    cnt: g.countdistinct(o => o.Id)
                }
            }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    applyGroupBy(): void {
        let url: URL = this.context.OrderItems.groupby(i => { return { Product: i.Product } }).orderby(g => g.key.Product).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((Product))&$orderby=Product', url);
    }
    applyGroupByAggregate(): void {
        let url: URL = this.context.OrderItems.groupby(i => { return { OrderId: i.OrderId, Status: i.Order.Status } })
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
                }
            }).orderby(g => g.orderId).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId,Order/Status),aggregate(Price with average as avg,Product with countdistinct as dcnt,Price with max as max,Order/Status with max as max_status,Price with min as min,Price with sum as sum,$count as cnt))&$orderby=OrderId', url)
    }
    applyGroupByAggregateCompute(): void {
        let url: URL = this.context.OrderItems.groupby(i => { return { Id: i.Order.Id, Name: i.Order.Name } })
            .select(g => {
                return {
                    id: g.key.Id,
                    sum: g.sum(i => i.Price),
                    nameLength: OdataFunctions.stringLength(g.key.Name)
                }
            }).orderby(g => g.id).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((Order/Id,Order/Name),aggregate(Price with sum as sum))/compute(length(Order/Name) as nameLength)&$orderby=Order/Id', url);
    }
    applyGroupByAggregateFilter(): void {
        let url: URL = this.context.OrderItems.filter(i => i.Price < 2)
            .groupby(i => { return { orderId: i.OrderId } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(i => i.Price)
                }
            }).filter(g => g.sum > 0).getQueryUrl();
        this.equal('OrderItems?$apply=filter(Price lt 2)/groupby((OrderId),aggregate(Price with sum as sum))&$filter=sum gt 0', url);
    }
    applyGroupByAggregateFilterOrdinal(): void {
        let url: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(i => i.Price)
                }
            }).filter(g => g.orderId == 2 && g.sum >= 4).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId),aggregate(Price with sum as sum))&$filter=OrderId eq 2 and sum ge 4', url);

        let scope = { orderId: 2, sum: 4 };
        let url2: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(i => i.Price)
                }
            }).filter(g => g.orderId == scope.orderId && g.sum >= scope.sum, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    applyGroupByAggregateOrderBy(): void {
        let url: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(i => i.Price)
                }
            }).orderby(g => g.sum).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId),aggregate(Price with sum as sum))&$orderby=sum', url);
    }
    applyGroupByFilter(): void {
        let url: URL = this.context.OrderItems.filter(i => i.OrderId == 1 && i.Order.Name == 'Order 1')
            .groupby(i => { return { orderId: i.OrderId, name: i.Order.Name } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    orderName: g.key.name
                }
            }).getQueryUrl();
        this.equal("OrderItems?$apply=filter(OrderId eq 1 and Order/Name eq 'Order 1')/groupby((OrderId,Order/Name))", url);

        let scope = { orderName: 'Order 1' };
        let url2: URL = this.context.OrderItems.filter(i => i.OrderId == 1 && i.Order.Name == scope.orderName, scope)
            .groupby(i => { return { orderId: i.OrderId, name: i.Order.Name } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    orderName: g.key.name
                }
            }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    applyGroupByMul(): void {
        let url: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(i => i.Price * i.Count)
                }
            }).orderby(g => g.orderId).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId),aggregate(Price mul Count with sum as sum))&$orderby=OrderId', url);
    }
    applyGroupByOrderBy(): void {
        let url: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId, name: i.Order.Name } })
            .orderbyDescending(g => g.key.orderId).orderby(g => g.key.name).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId,Order/Name))&$orderby=OrderId desc,Order/Name', url);
    }
    applyGroupByOrderBySkipTop(): void {
        let url: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId, name: i.Order.Name } })
            .orderbyDescending(g => g.key.orderId).orderby(g => g.key.name).skip(1).top(1).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId,Order/Name))&$orderby=OrderId desc,Order/Name&$skip=1&$top=1', url);
    }
    applyGroupBySkip(): void {
        let url: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId } })
            .orderby(g => g.key.orderId).skip(1).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId))&$orderby=OrderId&$skip=1', url);
    }
    applyGroupByTop(): void {
        let url: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId } })
            .orderby(g => g.key.orderId).top(1).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId))&$orderby=OrderId&$top=1', url);
    }
    applyGroupByVirtualCount(): void {
        let url: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    dcnt: g.countdistinct(i => i.Product.substring(0, 10)),
                    cnt: g.count()
                }
            }).filter(g => g.dcnt != g.cnt).orderby(g => g.orderId).getQueryUrl();
        this.equal('OrderItems?$apply=groupby((OrderId),aggregate(substring(Product,0,10) with countdistinct as dcnt,$count as cnt))&$filter=dcnt ne cnt&$orderby=OrderId', url);

        let scope = { pos1: 0, pos2: 10 };
        let url2: URL = this.context.OrderItems
            .groupby(i => { return { orderId: i.OrderId } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    dcnt: g.countdistinct(i => i.Product.substring(0, 10)),
                    cnt: g.count()
                }
            }, scope).filter(g => g.dcnt != g.cnt).orderby(g => g.orderId).getQueryUrl();
        this.equalUrl(url, url2);
    }
    compute(): void {
        let url: URL = this.context.OrderItems
            .expand(i => i.Order)
            .select(i => {
                return {
                    product: i.Product,
                    Total: i.Count * i.Price,
                    SumId: i.Id + i.OrderId
                }
            }).getQueryUrl();
        this.equal('OrderItems?$expand=Order&$select=Product&$compute=Count mul Price as Total,Id add OrderId as SumId', url);
    }
    count(): void {
        //not applicable
        //let count = await this.context.Orders.count();
        //return count;
    }
    dbQuery(): void {
        let url: URL = this.context.OrderItemsView.orderby(i => i.Name).orderby(i => i.Product).getQueryUrl();
        this.equal('OrderItemsView?$orderby=Name,Product', url);
    }
    expand(): void {
        let url: URL = this.context.Orders
            .expand(o => o.Customer)
            .expand(o => o.Items)
            .orderby(o => o.Id).getQueryUrl();
        this.equal('Orders?$expand=Customer,Items&$orderby=Id', url);
    }
    expandCollectionSingleSelectNestedName(): void {
        let url: URL = this.context.Customers
            .expand(c => c.CustomerShippingAddresses).thenExpand(c => c.ShippingAddress).thenSelect(csa => { return { p: csa.Address } })
            .asEntitySet().orderby(c => c.Country).orderby(c => c.Id).select(c => { return { p: c.Name } }).getQueryUrl();
        this.equal('Customers?$expand=CustomerShippingAddresses($expand=ShippingAddress($select=Address))&$select=Name&$orderby=Country,Id', url);
    }
    expandManyToMany(): void {
        let url: URL = this.context.Customers
            .expand(c => c.AltOrders)
            .expand(c => c.ShippingAddresses)
            .expand(c => c.Orders)
            .orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$expand=AltOrders,ShippingAddresses,Orders&$orderby=Country,Id', url);
    }
    expandAndSelect(): void {
        let url: URL = this.context.Orders
            .expand(o => o.AltCustomer)
            .expand(o => o.Customer)
            .expand(o => o.Items).thenOrderby(i => i.Id)
            .expand(o => o.ShippingAddresses).thenOrderby(i => i.Id)
            .select(o => {
                return {
                    p1: o.AltCustomerCountry,
                    p2: o.AltCustomerId,
                    p3: o.CustomerCountry,
                    p4: o.CustomerId,
                    p5: o.Date,
                    p6: o.Id,
                    p7: o.Name,
                    p8: o.Status
                }
            }).orderby(o => o.p6).getQueryUrl();
        this.equal('Orders?$expand=AltCustomer,Customer,Items($orderby=Id),ShippingAddresses($orderby=Id)&$select=AltCustomerCountry,AltCustomerId,CustomerCountry,CustomerId,Date,Id,Name,Status&$orderby=Id', url);
    }
    expandExpandFilter(): void {
        let url: URL = this.context.Customers
            .expand(c => c.AltOrders).thenExpand(o => o.Items).thenFilter(i => i.Product.includes('unknown')).thenOrderby(i => i.Id)
            .expand(c => c.Orders).thenExpand(o => o.Items).thenFilter(i => i.Product.includes('unknown')).thenOrderby(i => i.Id)
            .orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$expand=AltOrders($expand=Items($filter=contains(Product,\'unknown\');$orderby=Id)),Orders($expand=Items($filter=contains(Product,\'unknown\');$orderby=Id))&$orderby=Country,Id', url);

        let product = 'unknown';
        let url2: URL = this.context.Customers
            .expand(c => c.AltOrders).thenExpand(o => o.Items).thenFilter(i => i.Product.includes(product), { product: product }).thenOrderby(i => i.Id)
            .expand(c => c.Orders).thenExpand(o => o.Items).thenFilter(i => i.Product.includes(product), { product: product }).thenOrderby(i => i.Id)
            .orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    expandExpandMany(): void {
        let url: URL = this.context.Customers
            .expand(c => c.AltOrders).thenExpand(o => o.Items).thenOrderbyDescending(i => i.Price)
            .expand(c => c.AltOrders).thenExpand(o => o.ShippingAddresses).thenOrderbyDescending(s => s.Id)
            .expand(c => c.Orders).thenExpand(o => o.Items).thenOrderbyDescending(i => i.Price)
            .expand(c => c.Orders).thenExpand(o => o.ShippingAddresses).thenOrderbyDescending(s => s.Id)
            .orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$expand=AltOrders($expand=Items($orderby=Price desc),ShippingAddresses($orderby=Id desc)),Orders($expand=Items($orderby=Price desc),ShippingAddresses($orderby=Id desc))&$orderby=Country,Id', url);
    }
    expandExpandOne(): void {
        let url: URL = this.context.OrderItems
            .expand(i => i.Order).thenExpand(o => o.AltCustomer)
            .expand(i => i.Order).thenExpand(o => o.Customer).orderby(i => i.Id).getQueryUrl();
        this.equal('OrderItems?$expand=Order($expand=AltCustomer,Customer)&$orderby=Id', url);
    }
    expandExpandOrderBy(): void {
        let url: URL = this.context.Customers
            .expand(c => c.Orders).thenExpand(o => o.Items).thenOrderbyDescending(i => i.Id)
            .orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$expand=Orders($expand=Items($orderby=Id desc))&$orderby=Country,Id', url);
    }
    expandExpandSkipTop(): void {
        let url: URL = this.context.Customers
            .expand(c => c.AltOrders).thenExpand(o => o.Items).thenOrderby(i => i.Id).thenTop(1)
            .expand(c => c.Orders).thenExpand(o => o.Items).thenOrderby(i => i.Id).thenTop(1)
            .orderby(c => c.Country).orderby(c => c.Id).skip(1).top(3).getQueryUrl();
        this.equal('Customers?$expand=AltOrders($expand=Items($orderby=Id;$top=1)),Orders($expand=Items($orderby=Id;$top=1))&$orderby=Country,Id&$skip=1&$top=3', url);
    }
    expandInverseProperty(): void {
        let url: URL = this.context.Customers
            .expand(c => c.AltOrders)
            .expand(c => c.Orders)
            .orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$expand=AltOrders,Orders&$orderby=Country,Id', url);
    }
    expandManyFilter(): void {
        let url: URL = this.context.Customers
            .expand(c => c.Orders).thenFilter(o => o.Status === oe.OrderStatus.Processing)
            .orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$expand=Orders($filter=Status eq OdataToEntity.Test.Model.OrderStatus\'Processing\')&$orderby=Country,Id', url);

        let orderStatus: oe.OrderStatus.Processing;
        let url2: URL = this.context.Customers
            .expand(c => c.Orders).thenFilter(o => o.Status === orderStatus, { orderStatus: this.odataNamespace + '.OrderStatus\'Processing\'' })
            .orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    expandNestedSelect(): void {
        let url: URL = this.context.Customers
            .expand(c => c.Orders).thenSelect(o => {
                return {
                    p1: o.AltCustomerCountry,
                    p2: o.AltCustomerId,
                    p3: o.CustomerCountry,
                    p4: o.CustomerId,
                    p5: o.Date,
                    p6: o.Id,
                    p7: o.Name,
                    p8: o.Status
                }
            }).asEntitySet().orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$expand=Orders($select=AltCustomerCountry,AltCustomerId,CustomerCountry,CustomerId,Date,Id,Name,Status)&$orderby=Country,Id', url);
    }
    expandNullableNestedSelect(): void {
        let url: URL = this.context.Orders
            .expand(o => o.AltCustomer).thenSelect(o => {
                return {
                    p1: o.Address,
                    p2: o.Country,
                    p3: o.Id,
                    p4: o.Name,
                    p5: o.Sex
                }
            }).asEntitySet().orderby(o => o.Id).getQueryUrl();
        this.equal('Orders?$expand=AltCustomer($select=Address,Country,Id,Name,Sex)&$orderby=Id', url);
    }
    expandOneFilter(): void {
        let url: URL = this.context.Orders
            .expand(o => o.AltCustomer).thenFilter(c => c.Sex === oe.Sex.Male)
            .getQueryUrl();
        this.equal("Orders?$expand=AltCustomer($filter=Sex eq OdataToEntity.Test.Model.Sex'Male')", url);

        let sex: oe.Sex.Male = oe.Sex.Male;
        let url2: URL = this.context.Orders
            .expand(o => o.AltCustomer).thenFilter(c => c.Sex === sex, { sex: this.odataNamespace + '.Sex\'Male\'' })
            .getQueryUrl();
        this.equalUrl(url, url2)
    }
    expandStar(): void {
        //not applicable
    }
    filterAll(): void {
        let url: URL = this.context.Orders.filter(o => o.Items.every(i => i.Price >= 2.1)).getQueryUrl();
        this.equal('Orders?$filter=Items/all(d:d/Price ge 2.1)', url);

        let price = 2.1;
        let url2: URL = this.context.Orders.filter(o => o.Items.every(i => i.Price >= price), { price: price }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterAndHaving(): void {
        let url: URL = this.context.OrderItems.filter(i => i.Order.CustomerCountry != 'UN')
            .groupby(i => { return { orderId: i.OrderId } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(i => i.Price * i.Count)
                }
            }).filter(g => g.sum > 7).getQueryUrl();
        this.equal("OrderItems?$apply=filter(Order/CustomerCountry ne 'UN')/groupby((OrderId),aggregate(Price mul Count with sum as sum))&$filter=sum gt 7", url);

        let customerCountry: string = 'UN';
        let sum: number = 7;
        let scope = { customerCountry: customerCountry, sum: sum };
        let url2: URL = this.context.OrderItems.filter(i => i.Order.CustomerCountry != customerCountry, scope)
            .groupby(i => { return { orderId: i.OrderId } }).select(g => {
                return {
                    orderId: g.key.orderId,
                    sum: g.sum(i => i.Price * i.Count)
                }
            }).filter(g => g.sum > sum, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterAny(): void {
        let url: URL = this.context.Orders.filter(o => o.Items.some(i => i.Count > 2)).getQueryUrl();
        this.equal('Orders?$filter=Items/any(d:d/Count gt 2)', url);

        let count = 2;
        let url2: URL = this.context.Orders.filter(o => o.Items.some(i => i.Count > count), { count: count }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterCount(): void {
        let url: URL = this.context.Orders.filter(o => OdataFunctions.arrayLength(o.Items) > 2).getQueryUrl();
        this.equal('Orders?$filter=Items/$count gt 2', url);

        let length = 2;
        let url2: URL = this.context.Orders.filter(o => OdataFunctions.arrayLength(o.Items) > length, { length: length }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterDateTime(): void {
        let dt = new Date('2016-07-04T19:10:10.8237573+03:00');
        let url: URL = this.context.Categories.filter(o => o.DateTime >= dt, { dt: dt }).getQueryUrl();
        this.equal('Categories?$filter=DateTime ge 2016-07-04T16:10:10.823Z', url);
    }
    filterDateTimeNull(): void {
        let url: URL = this.context.Categories.filter(o => o.DateTime === null).getQueryUrl();
        this.equal('Categories?$filter=DateTime eq null', url);

        let dt: Date | null = null;
        let url2: URL = this.context.Categories.filter(o => o.DateTime === dt, { dt: dt }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterDateTimeOffset(): void {
        let url: URL = this.context.Orders.filter(o => o.Date >= new Date('2016-07-04T19:10:10.8237573+03:00')).getQueryUrl();
        this.equal('Orders?$filter=Date ge 2016-07-04T16:10:10.823Z', url);
    }
    filterDateTimeOffsetNull(): void {
        let url: URL = this.context.Orders.filter(o => o.Date == null).getQueryUrl();
        this.equal('Orders?$filter=Date eq null', url);
    }
    filterDateTimeOffsetYearMonthDay(): void {
        let url: URL = this.context.Orders.filter(o => o.Date.getFullYear() === 2016 && o.Date.getMonth() > 3 && o.Date.getDay() < 20).getQueryUrl();
        this.equal('Orders?$filter=year(Date) eq 2016 and month(Date) gt 3 and day(Date) lt 20', url);

        let scope = { year: 2016, month: 3, day: 20 }
        let url2: URL = this.context.Orders.filter(o => o.Date.getFullYear() === scope.year && o.Date.getMonth() > scope.month && o.Date.getDay() < scope.day, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterDateTimeYearMonthDay(): void {
        let url: URL = this.context.Categories.filter(c => c.DateTime.getFullYear() === 2016 && c.DateTime.getMonth() > 3 && c.DateTime.getDay() < 20).getQueryUrl();
        this.equal('Categories?$filter=year(DateTime) eq 2016 and month(DateTime) gt 3 and day(DateTime) lt 20', url);

        let scope = { year: 2016, month: 3, day: 20 }
        let url2: URL = this.context.Categories.filter(c => c.DateTime.getFullYear() === scope.year && c.DateTime.getMonth() > scope.month && c.DateTime.getDay() < scope.day, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterDecimal(): void {
        let url: URL = this.context.OrderItems.filter(i => i.Price > 2).getQueryUrl();
        this.equal('OrderItems?$filter=Price gt 2', url);

        let price = 2;
        let url2: URL = this.context.OrderItems.filter(i => i.Price > price, { price: price }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterDecimalNull(): void {
        let url: URL = this.context.OrderItems.filter(i => i.Price == null).getQueryUrl();
        this.equal('OrderItems?$filter=Price eq null', url);

        let price: number | null = null;
        let url2: URL = this.context.OrderItems.filter(i => i.Price == price, { price: price }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterEnum(): void {
        let url: URL = this.context.Customers.filter(c => c.Sex == oe.Sex.Female).getQueryUrl();
        this.equal('Customers?$filter=Sex eq OdataToEntity.Test.Model.Sex\'Female\'', url)

        let scope = { sex: 'OdataToEntity.Test.Model.Sex\'Female\'' };
        let url2: URL = this.context.Customers.filter(c => c.Sex == scope.sex, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    FilterEnumGe(): void {
        let url: URL = this.context.Orders.filter(o => o.Status >= oe.OrderStatus.Unknown).orderby(o => o.Id).getQueryUrl();
        this.equal('Orders?$filter=Status ge OdataToEntity.Test.Model.OrderStatus\'Unknown\'&$orderby=Id', url);

        let scope = { status: 'OdataToEntity.Test.Model.OrderStatus\'Unknown\'' };
        let url2: URL = this.context.Orders.filter(o => o.Status >= scope.status, scope).orderby(o => o.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterEnumLt(): void {
        let url: URL = this.context.Orders.filter(o => oe.OrderStatus.Unknown < o.Status).getQueryUrl();
        this.equal('Orders?$filter=OdataToEntity.Test.Model.OrderStatus\'Unknown\' lt Status', url);

        let scope = { status: 'OdataToEntity.Test.Model.OrderStatus\'Unknown\'' };
        let url2: URL = this.context.Orders.filter(o => scope.status < o.Status, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterEnumNull(): void {
        let url: URL = this.context.Customers.filter(c => c.Sex != null && c.Address != null).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$filter=Sex ne null and Address ne null&$orderby=Country,Id', url);

        let scope = { sex: null, address: null };
        let url2: URL = this.context.Customers.filter(c => c.Sex != scope.sex && c.Address != scope.address, scope).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterEnumNullableGe(): void {
        let url: URL = this.context.Customers.filter(c => c.Sex >= oe.Sex.Male).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$filter=Sex ge OdataToEntity.Test.Model.Sex\'Male\'&$orderby=Country,Id', url);

        let scope = { sex: 'OdataToEntity.Test.Model.Sex\'Male\'' };
        let url2: URL = this.context.Customers.filter(c => c.Sex >= scope.sex, scope).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterEnumNullableLt(): void {
        let url: URL = this.context.Customers.filter(c => oe.Sex.Male < c.Sex).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$filter=OdataToEntity.Test.Model.Sex\'Male\' lt Sex&$orderby=Country,Id', url);

        let scope = { sex: 'OdataToEntity.Test.Model.Sex\'Male\'' };
        let url2: URL = this.context.Customers.filter(c => scope.sex < c.Sex, scope).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterEnumNotNullAndStringNotNull(): void {
        let url: URL = this.context.Customers.filter(c => c.Sex == null && c.Address != null).getQueryUrl();
        this.equal('Customers?$filter=Sex eq null and Address ne null', url);

        let scope = { sex: null, address: null };
        let url2: URL = this.context.Customers.filter(c => c.Sex == scope.sex && c.Address != scope.address, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterEnumNullAndStringNull(): void {
        let url: URL = this.context.Customers.filter(c => c.Sex == null && c.Address == null).getQueryUrl();
        this.equal('Customers?$filter=Sex eq null and Address eq null', url);

        let scope = { sex: null, address: null };
        let url2: URL = this.context.Customers.filter(c => c.Sex == scope.sex && c.Address == scope.address, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterIn(): void {
        let url: URL = this.context.OrderItems.filter(i => [1.1, 1.2, 1.3].includes(i.Price)).orderby(i => i.Id).getQueryUrl();
        this.equal('OrderItems?$filter=Price in (1.1,1.2,1.3)&$orderby=Id', url);

        let items = [1.1, 1.2, 1.3];
        let url2: URL = this.context.OrderItems.filter(i => items.includes(i.Price), { items: items }).orderby(i => i.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterInEnum(): void {
        let url: URL = this.context.Customers.filter(c => [oe.Sex.Male, oe.Sex.Female].includes(c.Sex)).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal('Customers?$filter=Sex in (OdataToEntity.Test.Model.Sex\'Male\',OdataToEntity.Test.Model.Sex\'Female\')&$orderby=Country,Id', url);

        let scope = { items: ['OdataToEntity.Test.Model.Sex\'Male\'', 'OdataToEntity.Test.Model.Sex\'Female\''] };
        let url2: URL = this.context.Customers.filter(c => scope.items.includes(c.Sex), scope).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterInt(): void {
        let url: URL = this.context.OrderItems.filter(i => i.Count >= 2).getQueryUrl();
        this.equal('OrderItems?$filter=Count ge 2', url);

        let scope = { count: 2 };
        let url2: URL = this.context.OrderItems.filter(i => i.Count >= scope.count, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterIntNull(): void {
        let url: URL = this.context.OrderItems.filter(i => i.Count === null).getQueryUrl();
        this.equal('OrderItems?$filter=Count eq null', url);

        let count: number | null = null;
        let url2: URL = this.context.OrderItems.filter(i => i.Count == count, { count: count }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterNavigation(): void {
        let url: URL = this.context.OrderItems.filter(i => i.Order.Customer.Name == 'Ivan').getQueryUrl();
        this.equal('OrderItems?$filter=Order/Customer/Name eq \'Ivan\'', url);

        let scope = { name: 'Ivan' }
        let url2: URL = this.context.OrderItems.filter(i => i.Order.Customer.Name == scope.name, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterSegment(): void {
        //not supported
    }
    filterStringConcat(): void {
        let url: URL = this.context.Customers.filter(c => c.Name.concat(' hello', ' world') == 'Ivan hello world').getQueryUrl();
        this.equal("Customers?$filter=concat(concat(Name,' hello'),' world') eq 'Ivan hello world'", url);

        let scope = { str1: ' hello', str2: ' world' };
        let url2: URL = this.context.Customers.filter(c => c.Name.concat(scope.str1, scope.str2) == 'Ivan hello world', scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringEq(): void {
        let url: URL = this.context.Customers.filter(c => c.Address == 'Tula').getQueryUrl();
        this.equal("Customers?$filter=Address eq 'Tula'", url);

        let address = 'Tula';
        let url2: URL = this.context.Customers.filter(c => c.Address == address, { address: address }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringGe(): void {
        let url: URL = this.context.Customers.filter(c => c.Address >= 'Tula').getQueryUrl();
        this.equal("Customers?$filter=Address ge 'Tula'", url);

        let address = 'Tula';
        let url2: URL = this.context.Customers.filter(c => c.Address >= address, { address: address }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringGt(): void {
        let url: URL = this.context.Customers.filter(c => c.Address > 'Tula').getQueryUrl();
        this.equal("Customers?$filter=Address gt 'Tula'", url);

        let address = 'Tula';
        let url2: URL = this.context.Customers.filter(c => c.Address > address, { address: address }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringLe(): void {
        let url: URL = this.context.Customers.filter(c => c.Address <= 'Tula').orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal("Customers?$filter=Address le 'Tula'&$orderby=Country,Id", url);

        let address = 'Tula';
        let url2: URL = this.context.Customers.filter(c => c.Address <= address, { address: address }).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringLt(): void {
        let url: URL = this.context.Customers.filter(c => c.Address < 'Tula').orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal("Customers?$filter=Address lt 'Tula'&$orderby=Country,Id", url);

        let address = 'Tula';
        let url2: URL = this.context.Customers.filter(c => c.Address < address, { address: address }).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringNe(): void {
        let url: URL = this.context.Customers.filter(c => c.Address != 'Tula').orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal("Customers?$filter=Address ne 'Tula'&$orderby=Country,Id", url);

        let address = 'Tula';
        let url2: URL = this.context.Customers.filter(c => c.Address != address, { address: address }).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringEndsWith(): void {
        let url: URL = this.context.Customers.filter(c => c.Name.endsWith('asha')).getQueryUrl();
        this.equal("Customers?$filter=endswith(Name,'asha')", url);

        let str = 'asha';
        let url2: URL = this.context.Customers.filter(c => c.Name.endsWith(str), { str: str }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringLength(): void {
        let url: URL = this.context.Customers.filter(c => OdataFunctions.stringLength(c.Name) == 5).getQueryUrl();
        this.equal('Customers?$filter=length(Name) eq 5', url);

        let length = 5;
        let url2: URL = this.context.Customers.filter(c => OdataFunctions.stringLength(c.Name) == length, { length: length }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringIndexOf(): void {
        let url: URL = this.context.Customers.filter(c => c.Name.indexOf('asha') == 1).getQueryUrl();
        this.equal("Customers?$filter=indexof(Name,'asha') eq 1", url);

        let pos = 1;
        let url2: URL = this.context.Customers.filter(c => c.Name.indexOf('asha') == pos, { pos: pos }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringStartsWith(): void {
        let url: URL = this.context.Customers.filter(c => c.Name.startsWith('S')).getQueryUrl();
        this.equal("Customers?$filter=startswith(Name,'S')", url);

        let str = 'S';
        let url2: URL = this.context.Customers.filter(c => c.Name.startsWith(str), { str: str }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringSubstring(): void {
        let url: URL = this.context.Customers.filter(c => c.Name.substring(1, 1) == c.Name.substring(4, 1)).getQueryUrl();
        this.equal('Customers?$filter=substring(Name,1,1) eq substring(Name,4,1)', url);

        let pos1 = 1;
        let pos2 = 1;
        let pos3 = 4;
        let pos4 = 1;
        let scope = { pos1: pos1, pos2: pos2, pos3: pos3, pos4: pos4 };
        let url2: URL = this.context.Customers.filter(c => c.Name.substring(pos1, pos2) == c.Name.substring(pos3, pos4), scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringToLower(): void {
        let url: URL = this.context.Customers.filter(c => c.Name.toLowerCase() == 'sasha').getQueryUrl();
        this.equal("Customers?$filter=tolower(Name) eq 'sasha'", url);

        let name = 'sasha';
        let url2: URL = this.context.Customers.filter(c => c.Name.toLowerCase() == name, { name: name }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringToUpper(): void {
        let url: URL = this.context.Customers.filter(c => c.Name.toUpperCase() == 'SASHA').getQueryUrl();
        this.equal("Customers?$filter=toupper(Name) eq 'SASHA'", url);

        let name = 'SASHA';
        let url2: URL = this.context.Customers.filter(c => c.Name.toUpperCase() == name, { name: name }).getQueryUrl();
        this.equalUrl(url, url2);
    }
    filterStringTrim(): void {
        let url: URL = this.context.Customers.filter(c => c.Name.concat(' ').trim() == c.Name.trim()).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equal("Customers?$filter=trim(concat(Name,' ')) eq trim(Name)&$orderby=Country,Id", url);

        let space = ' ';
        let url2: URL = this.context.Customers.filter(c => c.Name.concat(space).trim() == c.Name.trim(), { space: space }).orderby(c => c.Country).orderby(c => c.Id).getQueryUrl();
        this.equalUrl(url, url2);
    }
    keyComposition(): void {
        let url: URL = this.context.Customers.key({ Country: 'RU', Id: 1 }).getQueryUrl();
        this.equal("Customers(Country='RU',Id=1)", url);
    }
    keyExpand(): void {
        let url: URL = this.context.Orders.key(1)
            .expand(o => o.Customer)
            .expand(o => o.Items)
            .getQueryUrl();
        this.equal('Orders(1)?$expand=Customer,Items', url);
    }
    keyFilter(): void {
        let url: URL = this.context.Orders.key(1, o => o.Items).filter(i => i.Count >= 2).getQueryUrl();
        this.equal('Orders(1)/Items?$filter=Count ge 2', url);

        let scope = { id: 1, count: 2 };
        let url2: URL = this.context.Orders.key(scope.id, o => o.Items).filter(i => i.Count >= scope.count, scope).getQueryUrl();
        this.equalUrl(url, url2);
    }
    keyMultipleNavigationOne(): void {
        let url: URL = this.context.OrderItems.key(1, i => i.Order.Customer).getQueryUrl();
        this.equal('OrderItems(1)/Order/Customer', url);
    }
    keyNavigationGroupBy(): void {
    }
    keyOrderBy(): void {
        let url: URL = this.context.Orders.key(1, o => o.Items).orderby(i => i.Count).orderby(i => i.Price).getQueryUrl();
        this.equal('Orders(1)/Items?$orderby=Count,Price', url);
    }
    orderByColumnsMissingInSelect(): void {
        let url: URL = this.context.OrderItems.orderbyDescending(i => i.Count).orderby(i => i.Order.Customer.Name).orderbyDescending(i => i.Id)
            .select(i => {
                return {
                    p1: i.Product,
                    p2: i.Id
                }
            }).getQueryUrl();
        this.equal('OrderItems?$select=Product,Id&$orderby=Count desc,Order/Customer/Name,Id desc', url);
    }
    orderByColumnsMissingInSelectNavigationFirst(): void {
        let url: URL = this.context.OrderItems.orderbyDescending(i => i.Order.Customer.Name).orderby(i => i.Count).orderbyDescending(i => i.Id)
            .select(i => {
                return {
                    p1: i.Product,
                    p2: i.Id
                }
            }).getQueryUrl();
        this.equal('OrderItems?$select=Product,Id&$orderby=Order/Customer/Name desc,Count,Id desc', url);
    }
    orderByDesc(): void {
        let url: URL = this.context.OrderItems.orderbyDescending(i => i.Id).orderbyDescending(i => i.Count).orderbyDescending(i => i.Price).getQueryUrl();
        this.equal('OrderItems?$orderby=Id desc,Count desc,Price desc', url);
    }
    orderByNavigation(): void {
        let url: URL = this.context.OrderItems.orderbyDescending(i => i.Order.Customer.Sex).orderby(i => i.Order.Customer.Name).orderbyDescending(i => i.Id).getQueryUrl();
        this.equal('OrderItems?$orderby=Order/Customer/Sex desc,Order/Customer/Name,Id desc', url);
    }
    parameterization(): void {
        let url: URL = this.context.Orders
            .filter(o => o.AltCustomerId == 3 && o.CustomerId == 4 && (o.Date.getFullYear() == 2016 && o.Date.getMonth() > 11 && o.Date.getDay() < 20 || o.Date == null) && o.Name.includes('unknown') && o.Status == oe.OrderStatus.Unknown)
            .expand(o => o.Items).thenFilter(i => (i.Count == 0 || i.Count == null) && (i.Price == 0 || i.Price == null) && (i.Product.includes('unknown') || i.Product.includes('null')) && i.OrderId > -1 && i.Id != 1)
            .getQueryUrl();
        this.equal("Orders?$filter=AltCustomerId eq 3 and CustomerId eq 4 and (year(Date) eq 2016 and month(Date) gt 11 and day(Date) lt 20 or Date eq null) and contains(Name,'unknown') and Status eq OdataToEntity.Test.Model.OrderStatus'Unknown'&$expand=Items($filter=(Count eq 0 or Count eq null) and (Price eq 0 or Price eq null) and (contains(Product,'unknown') or contains(Product,'null')) and OrderId gt -1 and Id ne 1)", url);

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
        let url2: URL = this.context.Orders
            .filter(o => o.AltCustomerId == s.altCustomerId && o.CustomerId == s.customerId && (o.Date.getFullYear() == s.dateYear && o.Date.getMonth() > s.dateMonth && o.Date.getDay() < s.dateDay || o.Date == s.date) && o.Name.includes(s.name) && o.Status == s.status, s)
            .expand(o => o.Items).thenFilter(i => (i.Count == s.count1 || i.Count == s.count2) && (i.Price == s.price1 || i.Price == s.price2) && (i.Product.includes(s.product1) || i.Product.includes(s.product2)) && i.OrderId > s.orderId && i.Id != s.id, s)
            .getQueryUrl();
        this.equalUrl(url, url2);
    }
    referencedModels(): void {
        //not applicable
    }
    select(): void {
        let url: URL = this.context.Orders.select(o => {
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
            }
        }).orderby(o => o.p08).getQueryUrl();
        this.equal('Orders?$select=AltCustomer,AltCustomerCountry,AltCustomerId,Customer,CustomerCountry,CustomerId,Date,Id,Items,Name,ShippingAddresses,Status&$orderby=Id', url);
    }
    selectName(): void {
        let url: URL = this.context.Orders.select(o => { return { p: o.Name } }).getQueryUrl();
        this.equal('Orders?$select=Name', url);
    }
    selectNestedName(): void {
        let url: URL = this.context.Orders
            .expand(o => o.Items).thenFilter(i => i.OrderId == 1).thenSelect(o => { return { p: o.Product } })
            .asEntitySet().select(o => { return { p: o.Name } }).getQueryUrl();
        this.equal('Orders?$expand=Items($filter=OrderId eq 1;$select=Product)&$select=Name', url);
    }
    table(): void {
        let url: URL = this.context.Orders.orderby(o => o.Id).getQueryUrl();
        this.equal('Orders?$orderby=Id', url);
    }
    topSkip(): void {
        let url: URL = this.context.Customers.orderby(o => o.Id).skip(2).top(3).getQueryUrl();
        this.equal('Customers?$orderby=Id&$skip=2&$top=3', url);
    }

    runAll() {
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
        this.topSkip();
    }
    equal(expected: string, actual: URL): void {
        let expectedQuery: string = this.baseUri + '/' + expected;
        let actualQuery: string = decodeURIComponent(actual.href).replace(/\+/g, ' ');
        if (expectedQuery !== actualQuery)
            throw 'expected: ' + expectedQuery + '\r\n' + 'actual: ' + actualQuery;

        console.log(expected);
        this.execute(actual);
    }
    equalUrl(expected: URL, actual: URL): void {
        if (expected.href !== actual.href)
            throw 'expected href: ' + expected.href + '\r\n' + 'actual href: ' + actual.href;
    }
    execute(queryUrl: URL): void {
        let request = new Request(queryUrl.href, {
            headers: new Headers({
                "Content-Type": "application/json"
            }),
            method: "GET"
        });
        fetch(request).then(r => r.text().then(t => console.log(t)));
    }
}