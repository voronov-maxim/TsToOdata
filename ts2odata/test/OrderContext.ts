import { EntitySet } from '../source/EntitySet';
import { OdataContext } from '../source/OdataContext';
import * as oe from './order';

export class OrderContext extends OdataContext<OrderContext> {
    Categories = EntitySet.default<oe.Category>();
    Customers = EntitySet.default<oe.Customer>();
    OrderItems = EntitySet.default<oe.OrderItem>();
    OrderItemsView = EntitySet.default<oe.OrderItemsView>();
    Orders = EntitySet.default<oe.Order>();
}