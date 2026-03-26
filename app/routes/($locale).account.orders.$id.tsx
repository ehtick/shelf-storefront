import {redirect, type LoaderFunctionArgs} from 'react-router';
import {useLoaderData, type MetaFunction} from 'react-router';
import {Money, Image, flattenConnection} from '@shopify/hydrogen';
import type {OrderLineItemFullFragment} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';
import {Table, Td, Th, Tr} from '~/components/layout/table';
import {tw} from '~/utils/tw';
import {Button} from '~/components/button';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Order ${data?.order?.name}`}];
};

export async function loader({params, context}: LoaderFunctionArgs) {
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_ORDER_QUERY,
    {
      variables: {orderId},
    },
  );

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  const lineItems = flattenConnection(order.lineItems);
  const discountApplications = flattenConnection(order.discountApplications);
  // const fulfillmentStatus = flattenConnection(order.fulfillments)[0].status;

  const firstDiscount = discountApplications[0]?.value;

  const discountValue =
    firstDiscount?.__typename === 'MoneyV2' && firstDiscount;

  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue' &&
    firstDiscount?.percentage;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    // fulfillmentStatus,
  };
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    // fulfillmentStatus,
  } = useLoaderData<typeof loader>();
  const labelClasses = `font-medium`;
  return (
    <div className="account-order">
      <h2>Order {order.name}</h2>
      <p>Placed on {new Date(order.processedAt!).toDateString()}</p>
      <br />
      <div>
        <Table className="border">
          <thead className="[&_th]:font-medium [&_th]:text-gray-800">
            <tr>
              <Th scope="col">Product</Th>
              <Th scope="col">Price</Th>
              <Th scope="col">Quantity</Th>
              <Th scope="col" className="text-right">
                Total
              </Th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((lineItem, lineItemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
          </tbody>
          <tfoot>
            {((discountValue && discountValue.amount) ||
              discountPercentage) && (
              <Tr>
                <Th scope="row" className={tw(labelClasses)}>
                  Discounts
                </Th>
                <Th scope="row" className={tw(labelClasses)}>
                  Discounts
                </Th>
                <Td>
                  {discountPercentage ? (
                    <span>-{discountPercentage}% OFF</span>
                  ) : (
                    discountValue && <Money data={discountValue!} />
                  )}
                </Td>
              </Tr>
            )}
            <Tr>
              <Td scope="row" className={tw(labelClasses)}>
                Subtotal
              </Td>
              <Td />

              <Td scope="row" className={tw(labelClasses)}>
                Subtotal
              </Td>
              <Td className="text-right">
                <Money data={order.subtotal!} />
              </Td>
            </Tr>
            <Tr>
              <Td scope="row" className={tw(labelClasses)}>
                Tax
              </Td>
              <Td />
              <Td scope="row" className={tw(labelClasses)}>
                Tax
              </Td>
              <Td className="text-right">
                <Money data={order.totalTax!} />
              </Td>
            </Tr>
            <Tr>
              <Td scope="row" className={tw(labelClasses, ' text-[18px]')}>
                Total
              </Td>
              <Td />
              <Td scope="row" className={tw(labelClasses)}>
                Total
              </Td>
              <Td className="text-right">
                <Money data={order.totalPrice!} />
              </Td>
            </Tr>
          </tfoot>
        </Table>
        <div className="mt-4">
          <h3>Shipping Address</h3>
          {order?.shippingAddress ? (
            <address className="mt-2">
              {order.shippingAddress.formatted.map((line, index) => (
                <div key={line} className="text-[16px] not-italic font-normal">
                  {line}
                </div>
              ))}
            </address>
          ) : (
            <p>No shipping address defined</p>
          )}
          {/* <h3>Status</h3>
          <div>
            <p>{order.financialStatus}</p>
          </div> */}
        </div>
      </div>
      <br />
      <p>
        <Button
          target="_blank"
          to={order.statusPageUrl}
          variant="secondary"
          rel="noreferrer"
        >
          View Order Status
        </Button>
      </p>
    </div>
  );
}

function OrderLineRow({lineItem}: {lineItem: OrderLineItemFullFragment}) {
  return (
    <Tr key={lineItem.id}>
      <Td>
        <div className="flex gap-3">
          {lineItem?.image && (
            <div>
              <Image
                data={lineItem.image}
                width={96}
                height={96}
                className="border rounded-md"
              />
            </div>
          )}
          <div>
            <div className="font-medium">{lineItem.title}</div>
            <small>{lineItem.variantTitle}</small>
          </div>
        </div>
      </Td>
      <Td>
        <Money data={lineItem.price!} />
      </Td>
      <Td>{lineItem.quantity}</Td>
      <Td className="text-right">
        <Money
          data={
            {
              amount: String(
                Number(lineItem.price?.amount) * lineItem.quantity,
              ),
              currencyCode: lineItem.price?.currencyCode,
            }!
          }
        />
      </Td>
    </Tr>
  );
}
