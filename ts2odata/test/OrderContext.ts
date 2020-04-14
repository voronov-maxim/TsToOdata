import { EntitySet } from '../source/EntitySet';
import { OdataContext } from '../source/OdataContext';
import * as oe from './order';
import { Traverse } from '../../ts2odata-babel/source/traverse';
import { TraverseBase } from '../source/types';

export class OrderContext extends OdataContext<OrderContext> {
    constructor(traverse: TraverseBase) {
        super(traverse);
    }
    Categories = EntitySet.default<oe.Category>();
    Customers = EntitySet.default<oe.Customer>();
    OrderItems = EntitySet.default<oe.OrderItem>();
    OrderItemsView = EntitySet.default<oe.OrderItemsView>();
    Orders = EntitySet.default<oe.Order>();
}