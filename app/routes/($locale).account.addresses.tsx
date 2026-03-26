import type {CustomerAddressInput} from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import {
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type MetaFunction,
} from 'react-router';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';
import Input from '~/components/form/input';
import {Button} from '~/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/shadcn/dialog';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: MetaFunction = () => {
  return [{title: 'Addresses'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: ActionFunctionArgs) {
  const {customerAccount} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return Response.json(
        {error: {[addressId]: 'Unauthorized'}},
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {address, defaultAddress},
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return Response.json(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return Response.json(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return Response.json(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return Response.json(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {addressId: decodeURIComponent(addressId)},
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return {error: null, deletedAddress: addressId};
        } catch (error: unknown) {
          if (error instanceof Error) {
            return Response.json(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return Response.json(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return Response.json(
          {error: {[addressId]: 'Method not allowed'}},
          {
            status: 405,
          },
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return Response.json(
        {error: error.message},
        {
          status: 400,
        },
      );
    }
    return Response.json(
      {error},
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const {defaultAddress, addresses} = customer;

  return (
    <div className="account-addresses flex gap-6">
      <div className="flex-1">
        <div className="flex gap-3 items-center mb-4">
          <h2 className="mb-0">Addresses</h2>
          <NewAddressForm />
        </div>
        {!addresses.nodes.length ? (
          <p>You have no addresses saved.</p>
        ) : (
          <div>
            <ExistingAddresses
              addresses={addresses}
              defaultAddress={defaultAddress}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  } as CustomerAddressInput;

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="secondary">Create new address</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new address</DialogTitle>
          <DialogDescription className="mb-4">
            Add an address to your shelf store account to make checkout faster.
          </DialogDescription>
          <AddressForm
            addressId={'NEW_ADDRESS_ID'}
            address={newAddress}
            defaultAddress={null}
          >
            {({stateForMethod}) => (
              <div>
                <Button
                  disabled={stateForMethod('POST') !== 'idle'}
                  formMethod="POST"
                  type="submit"
                >
                  {stateForMethod('POST') !== 'idle' ? 'Creating' : 'Create'}
                </Button>
              </div>
            )}
          </AddressForm>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

function ExistingAddresses({
  addresses,
  defaultAddress,
}: Pick<CustomerFragment, 'addresses' | 'defaultAddress'>) {
  return (
    <div>
      <legend>Existing addresses</legend>
      {addresses.nodes.map((address) => (
        <AddressForm
          key={address.id}
          addressId={address.id}
          address={address}
          defaultAddress={defaultAddress}
        >
          {({stateForMethod}) => (
            <div className="flex flex-row gap-3 justify-end">
              <Button
                disabled={stateForMethod('DELETE') !== 'idle'}
                formMethod="DELETE"
                type="submit"
                variant="secondary"
              >
                {stateForMethod('DELETE') !== 'idle' ? 'Deleting' : 'Delete'}
              </Button>
              <Button
                disabled={stateForMethod('PUT') !== 'idle'}
                formMethod="PUT"
                type="submit"
              >
                {stateForMethod('PUT') !== 'idle' ? 'Saving' : 'Save'}
              </Button>
            </div>
          )}
        </AddressForm>
      ))}
    </div>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (
      method: 'PUT' | 'POST' | 'DELETE',
    ) => ReturnType<typeof useNavigation>['state'];
  }) => React.ReactNode;
}) {
  const {state, formMethod} = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  return (
    <Form id={addressId}>
      <input type="hidden" name="addressId" defaultValue={addressId} />
      {/* <label htmlFor="firstName">First name*</label> */}
      <Input
        aria-label="First name"
        autoComplete="given-name"
        defaultValue={address?.firstName ?? ''}
        id="firstName"
        name="firstName"
        placeholder="First name"
        required
        type="text"
        label="First name"
      />
      <Input
        aria-label="Last name"
        autoComplete="family-name"
        defaultValue={address?.lastName ?? ''}
        id="lastName"
        name="lastName"
        placeholder="Last name"
        required
        type="text"
        label="Last name"
      />
      <Input
        aria-label="Company"
        autoComplete="organization"
        defaultValue={address?.company ?? ''}
        id="company"
        name="company"
        placeholder="Company"
        type="text"
        label="Company"
      />
      <Input
        aria-label="Address line 1"
        autoComplete="address-line1"
        defaultValue={address?.address1 ?? ''}
        id="address1"
        name="address1"
        placeholder="Address line 1*"
        required
        type="text"
        label="Address line 1"
      />
      <Input
        aria-label="Address line 2"
        autoComplete="address-line2"
        defaultValue={address?.address2 ?? ''}
        id="address2"
        name="address2"
        placeholder="Address line 2"
        type="text"
        label="Address line 2"
      />
      <Input
        aria-label="City"
        autoComplete="address-level2"
        defaultValue={address?.city ?? ''}
        id="city"
        name="city"
        placeholder="City"
        required
        type="text"
        label="City"
      />
      <Input
        aria-label="State/Province"
        autoComplete="address-level1"
        defaultValue={address?.zoneCode ?? ''}
        id="zoneCode"
        name="zoneCode"
        placeholder="State / Province"
        required
        type="text"
        label="State / Province"
      />
      <Input
        aria-label="Zip"
        autoComplete="postal-code"
        defaultValue={address?.zip ?? ''}
        id="zip"
        name="zip"
        placeholder="Zip / Postal Code"
        required
        type="text"
        label="Zip / Postal Code"
      />
      <Input
        aria-label="territoryCode"
        autoComplete="country"
        defaultValue={address?.territoryCode ?? ''}
        id="territoryCode"
        name="territoryCode"
        placeholder="Country"
        required
        type="text"
        maxLength={2}
        label="Country Code"
      />
      <Input
        aria-label="Phone Number"
        autoComplete="tel"
        defaultValue={address?.phoneNumber ?? ''}
        id="phoneNumber"
        name="phoneNumber"
        placeholder="+16135551111"
        pattern="^\+?[1-9]\d{3,14}$"
        type="tel"
        label="Phone Number"
      />
      <Input
        defaultChecked={isDefaultAddress}
        id="defaultAddress"
        name="defaultAddress"
        type="checkbox"
        inputType="checkbox"
        label="Set as default address"
      />
      {error ? (
        <p>
          <mark>
            <small>{error}</small>
          </mark>
        </p>
      ) : (
        <br />
      )}
      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}
