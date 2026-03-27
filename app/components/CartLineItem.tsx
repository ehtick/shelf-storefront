import type {
  CartLineUpdateInput,
  Maybe,
} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';
import {Button} from './button';
import {MinusIcon, PlusIcon} from '@radix-ui/react-icons';
import {tw} from '~/utils/tw';
import {TrashIcon} from './icons';

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 */
export function CartLineItem({
  layout,
  line,
  className,
}: {
  layout: CartLayout;
  line: OptimisticCartLine;
  className?: string;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const customLogo = line?.attributes?.find(
    (attribute) => attribute.key === 'logo',
  )?.value;
  return (
    <li
      key={id}
      className={tw(
        'flex gap-5 cart-item border-b border-gray-200 py-4',
        className,
      )}
    >
      {image && (
        <Image
          alt={title}
          aspectRatio="1/1"
          data={image}
          height={100}
          loading="lazy"
          width={100}
          className="h-[100px] w-[100px] bg-gray-100 rounded-[4px]"
        />
      )}

      <div>
        <Link
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => {
            if (layout === 'aside') {
              close();
            }
          }}
          className="font-semibold text-sm text-gray-700 item-link block"
        >
          <div className="flex gap-2">
            <div>
              {product.title}
              {selectedOptions.map(
                (option) =>
                  option.value !== 'Default Title' && (
                    <div
                      key={option.name}
                      className="text-[12px] text-gray-600 font-normal"
                    >
                      {option.value}
                    </div>
                  ),
              )}
            </div>
          </div>
        </Link>
        {customLogo && (
          <div>
            <Link
              to={customLogo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-blue-600 font-normal block"
            >
              View uploaded file
            </Link>
          </div>
        )}

        <div className="flex justify-between items-center mt-3">
          <ProductPrice price={line?.cost?.totalAmount} />

          <CartLineQuantity line={line} />
        </div>
      </div>
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 */
function CartLineQuantity({line}: {line: OptimisticCartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));
  const logo = line?.attributes?.find(
    (attribute) => attribute.key === 'logo',
  )?.value;
  return (
    <div className="flex gap-3 items-center">
      <div className="cart-line-quantity ">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <Button
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrease-quantity"
            value={prevQuantity}
            variant="secondary"
            size="sm"
            className="rounded-r-none p-2"
          >
            <MinusIcon />
          </Button>
        </CartLineUpdateButton>
        <input
          value={quantity}
          disabled
          className="h-[33px] w-[50px] px-3 py-2  border-l-0 border-r-0  opacity-[0px] m-0 border-gray-300 rounded-none text-[12px] text-center"
        />
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <Button
            aria-label="Increase quantity"
            name="increase-quantity"
            value={nextQuantity}
            disabled={!!isOptimistic}
            variant="secondary"
            size="sm"
            className="rounded-l-none p-2"
          >
            <PlusIcon />
          </Button>
        </CartLineUpdateButton>
        {/* <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} /> */}
      </div>
      <CartLineRemoveButton
        lineIds={[lineId]}
        disabled={!!line.isOptimistic}
        logo={logo}
      />
    </div>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
  lineIds,
  disabled,
  logo,
}: {
  lineIds: string[];
  disabled: boolean;
  logo?: Maybe<string>;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds, logo}}
    >
      <button
        disabled={disabled}
        type="submit"
        className="w-[16px] h-[16px] block"
      >
        <TrashIcon />
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}
