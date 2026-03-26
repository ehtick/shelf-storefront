import {type LoaderFunctionArgs, data as dataResponse} from 'react-router';
import {Form, NavLink, Outlet, useLoaderData} from 'react-router';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import HorizontalTabs from '~/components/layout/horizontal-tabs';
import {Button} from '~/components/button';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: LoaderFunctionArgs) {
  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_DETAILS_QUERY,
  );

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return dataResponse(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `Welcome to your account.`
    : 'Account Details';

  return (
    <div className="account container pb-20">
      <div className="flex flex-row justify-between items-center">
        <h1>{heading}</h1>
        <Logout />
      </div>
      <AccountMenu />
      <Outlet context={{customer}} />
    </div>
  );
}

function AccountMenu() {
  return (
    <HorizontalTabs
      items={[
        {to: '/account/orders', content: 'Orders'},
        {to: '/account/profile', content: 'Profile'},
        {to: '/account/addresses', content: 'Addresses'},
      ]}
      className="pl-0 ml-0"
    />
  );
}

function Logout() {
  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <Button
        type="submit"
        variant="link"
        className="text-gray-800 font-normal"
      >
        Sign out
      </Button>
    </Form>
  );
}
