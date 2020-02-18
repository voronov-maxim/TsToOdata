import { OdataContext } from '../source/OdataContext';
import { OdataParser, EntityDefinition } from '../source/OdataParser';
import { EntitySetContext } from '../source/EntitySetContext';

import { OrderContext } from './OrderContext';
import * as oe from './order';

export class OdataParserTests {
    private readonly baseUri: string;
    private readonly context: OrderContext;
    private readonly odataNamespace = 'OdataToEntity.Test.Model';

    constructor(baseUri: string, odataParser: OdataParser) {
        this.baseUri = baseUri;
        this.context = OdataContext.create(OrderContext, baseUri, this.odataNamespace, odataParser);
    }

    fixEnum(): void {
        const expected = "Order/Customer/Sex eq OdataToEntity.Test.Model.Sex'Male'";
        let entitySet: any = this.context.OrderItems;
        let expression: string;

        expression = entitySet.traverseFilter('i => i.Order.Customer.Sex == oe.Sex.Male');
        if (expression !== expected)
            throw 'fixEnum failed';

        expression = entitySet.traverseFilter('i => i.Order.Customer.Sex == n.Male');
        if (expression !== expected)
            throw 'fixEnum failed';

        expression = entitySet.traverseFilter("i => i.Order.Customer.Sex == 'Male'");
        if (expression !== expected)
            throw 'fixEnum failed';

        let param = oe.Sex.Male;
        let scope = { param };
        expression = entitySet.traverseFilter("i => i.Order.Customer.Sex == param", scope);
        if (expression !== expected)
            throw 'fixEnum failed';

        expression = entitySet.traverseFilter("i => i.Order.Customer.Sex == scope.param", scope);
        if (expression !== expected)
            throw 'fixEnum failed';

        expression = entitySet.traverseFilter("i => i.Order.Customer.Sex == null");
        if (expression !== 'Order/Customer/Sex eq null')
            throw 'fixEnum failed';

        expression = entitySet.traverseFilter("i => i.Order.Customer.Sex == param", { param: null });
        if (expression !== 'Order/Customer/Sex eq null')
            throw 'fixEnum failed';

        expression = entitySet.traverseFilter("i => i.Order.Customer.Sex == n.param", { param: null });
        if (expression !== 'Order/Customer/Sex eq null')
            throw 'fixEnum failed';

        entitySet = this.context.Orders.filter(o => o.Status === oe.OrderStatus.Processing);
        expression = entitySet.traverseFilter('o => o.Status === x.Processing');
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
    runAll(): void {
        this.fixEnum();
        this.getEntityDefinition();
    }
}