import { Traverse } from '../../ts2odata-babel/source/traverse';
import { EntitySetContext } from '../source/EntitySetContext';
import { OdataContext } from '../source/OdataContext';
import { EntityDefinition, OdataParser } from '../source/OdataParser';
import * as oe from './order';
import { OrderContext } from './OrderContext';
import { TraverseBase } from '../source/types';


export class OdataParserTests {
    private readonly baseUri: string;
    private readonly context: OrderContext;
    private readonly odataNamespace = 'OdataToEntity.Test.Model';

    constructor(traverse: TraverseBase,  baseUri: string, odataParser: OdataParser) {
        this.baseUri = baseUri;
        this.context = OdataContext.create(() => new OrderContext(traverse), baseUri, this.odataNamespace, odataParser);
    }

    fixEnum(): void {
        const expected = "Order/Customer/Sex eq OdataToEntity.Test.Model.Sex'Male'";
        let entitySet: any = this.context.OrderItems;
        let entitySetContext = entitySet.entitySetContext as EntitySetContext;
        let traverse = new Traverse();
        let expression: string;

        expression = traverse.traverseFilter(entitySetContext, 'i => i.Order.Customer.Sex == oe.Sex.Male');
        if (expression !== expected)
            throw 'fixEnum failed';

        expression = traverse.traverseFilter(entitySetContext, 'i => i.Order.Customer.Sex == n.Male');
        if (expression !== expected)
            throw 'fixEnum failed';

        expression = traverse.traverseFilter(entitySetContext, "i => i.Order.Customer.Sex == 'Male'");
        if (expression !== expected)
            throw 'fixEnum failed';

        let param = oe.Sex.Male;
        let scope = { param };
        expression = traverse.traverseFilter(entitySetContext, "i => i.Order.Customer.Sex == param", scope);
        if (expression !== expected)
            throw 'fixEnum failed';

        expression = traverse.traverseFilter(entitySetContext, "i => i.Order.Customer.Sex == scope.param", scope);
        if (expression !== expected)
            throw 'fixEnum failed';

        expression = traverse.traverseFilter(entitySetContext, "i => i.Order.Customer.Sex == null");
        if (expression !== 'Order/Customer/Sex eq null')
            throw 'fixEnum failed';

        expression = traverse.traverseFilter(entitySetContext, "i => i.Order.Customer.Sex == param", { param: null });
        if (expression !== 'Order/Customer/Sex eq null')
            throw 'fixEnum failed';

        expression = traverse.traverseFilter(entitySetContext, "i => i.Order.Customer.Sex == n.param", { param: null });
        if (expression !== 'Order/Customer/Sex eq null')
            throw 'fixEnum failed';

        entitySet = this.context.Orders;
        entitySetContext = entitySet.entitySetContext as EntitySetContext;
        expression = traverse.traverseFilter(entitySetContext, 'o => o.Status === x.Processing');
        if (expression !== "Status eq OdataToEntity.Test.Model.OrderStatus'Processing'")
            throw 'fixEnum failed';
    }
    getEntityDefinition(): void {
        let entitySet: any = this.context.Customers;
        let entitySetContext = entitySet.entitySetContext as EntitySetContext;
        let entityDef: EntityDefinition = entitySetContext.getEntityDefinition();
        if (entityDef.entityName !== 'Customer')
            throw 'getEntiyDefinition failed'

        entitySet = this.context.Customers.expand(c => c.Orders).thenExpand(o => o.Items);
        entitySetContext = entitySet.entitySetContext as EntitySetContext;
        entityDef = entitySetContext.getEntityDefinition();
        if (entityDef.entityName !== 'OrderItem')
            throw 'getEntiyDefinition failed'
    }
    habrExample(): void {
        let url: URL = this.context.Customers
            .expand(c => c.Orders).thenSelect(o => { return { Date: o.Date } }).orderby(o => o.Date)
            .asEntitySet().select(c => { return { Name: c.Name } }).orderby(c => c.Name).getQueryUrl();
        this.equal('Customers?$expand=Orders($select=Date;$orderby=Date)&$select=Name&$orderby=Name', url);
    }
    runAll(): void {
        this.fixEnum();
        this.getEntityDefinition();
        this.habrExample();
    }

    equal(expected: string, actual: URL): void {
        let expectedQuery: string = this.baseUri + '/' + expected;
        let actualQuery: string = decodeURIComponent(actual.href).replace(/\+/g, ' ');
        if (expectedQuery !== actualQuery)
            throw 'expected: ' + expectedQuery + '\r\n' + 'actual: ' + actualQuery;

        console.log(expected);
    }
}