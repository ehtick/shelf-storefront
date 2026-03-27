import {Link, useLoaderData, type MetaFunction} from 'react-router';
import {Money, Pagination, getPaginationVariables} from '@shopify/hydrogen';
import {type LoaderFunctionArgs} from 'react-router';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {Table, Td, Th, Tr} from '~/components/layout/table';
import {Button} from '~/components/button';

export const meta: MetaFunction = () => {
  return [{title: 'Orders'}];
};

export async function loader({request, context}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_ORDERS_QUERY,
    {
      variables: {
        ...paginationVariables,
      },
    },
  );

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer};
}

export default function Orders() {
  const {customer} = useLoaderData<{customer: CustomerOrdersFragment}>();
  const {orders} = customer;

  return (
    <div className="orders">
      {orders.nodes.length ? <OrdersTable orders={orders} /> : <EmptyOrders />}
    </div>
  );
}

function OrdersTable({orders}: Pick<CustomerOrdersFragment, 'orders'>) {
  return (
    <div className="acccount-orders max-w-full overflow-scroll">
      {orders?.nodes.length ? (
        <Pagination connection={orders}>
          {({nodes, isLoading, PreviousLink, NextLink}) => {
            return (
              <>
                <PreviousLink>
                  {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
                </PreviousLink>
                <Table className="border">
                  <thead>
                    <Tr>
                      <Th>Order</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Total</Th>
                      <Th className="max-w-full whitespace-nowrap" />
                    </Tr>
                  </thead>
                  <tbody>
                    {nodes.map((order) => {
                      return <OrderItem key={order.id} order={order} />;
                    })}
                  </tbody>
                </Table>

                <NextLink>
                  {isLoading ? 'Loading...' : <span>Load more ↓</span>}
                </NextLink>
              </>
            );
          }}
        </Pagination>
      ) : (
        <EmptyOrders />
      )}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div>
      <p>You haven&apos;t placed any orders yet.</p>
      <br />
      <p>
        <Link to="/collections">Start Shopping →</Link>
      </p>
    </div>
  );
}

function OrderItem({order}: {order: OrderItemFragment}) {
  return (
    <Tr>
      <Td>
        <Link to={`/account/orders/${btoa(order.id)}`}>
          <strong>{order.name}</strong>
        </Link>
      </Td>
      <Td>{new Date(order.processedAt).toDateString()}</Td>
      <Td>{order.financialStatus}</Td>
      <Td className="text-right">
        <Money data={order.totalPrice} />
      </Td>
      <Td className="whitespace-nowrap w-1">
        <Button variant="link" to={`/account/orders/${btoa(order.id)}`}>
          View Order →
        </Button>
      </Td>
    </Tr>
  );
}
