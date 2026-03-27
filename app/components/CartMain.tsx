import {type OptimisticCartLine, useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {tw} from '~/utils/tw';
import {AnimatePresence, motion} from 'framer-motion';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity! > 0;
  const isCartPage = layout === 'page';
  return (
    <div className={className}>
      <CartEmpty hidden={linesCount} layout={layout} />
      <div
        className={tw(
          'cart-details flex flex-col justify-between',
          !isCartPage && 'h-full',
        )}
      >
        <div>
          {/* Discount Banner */}
          {/* <AnimatePresence>
            {linesCount && (
              <motion.div
                initial={{height: 0, opacity: 0}}
                animate={{height: 'auto', opacity: 1}}
                exit={{height: 0, opacity: 0}}
                className="bg-teal-50 border mb-4 border-teal-200 p-3 flex items-center justify-center overflow-hidden"
              >
                <div className="text-center">
                  <p className="text-sm font-bold text-teal-800 mb-1">
                    🎁 Special Offer: 10% OFF your order 🎁
                  </p>
                  <p className="text-xs text-teal-700">
                    Use code{' '}
                    <span className="font-bold bg-teal-100 px-1 py-0.5 rounded">
                      WELCOME10
                    </span>{' '}
                    at checkout
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence> */}
          <div aria-labelledby="cart-lines">
            <ul>
              {(cart?.lines?.nodes ?? []).map(
                // @ts-ignore
                (line: OptimisticCartLine, index: number) => (
                  <CartLineItem
                    key={line.id}
                    line={line}
                    layout={layout}
                    className={index === 0 ? '!pt-0' : ''}
                  />
                ),
              )}
            </ul>
          </div>
        </div>

        {cartHasItems && <CartSummary cart={cart} layout={layout} />}
      </div>
    </div>
  );
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  return (
    <div hidden={hidden}>
      <br />
      <p>
        Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
        started!
      </p>
      <br />
      <Link to="/collections/all" onClick={close} prefetch="viewport">
        Continue shopping →
      </Link>
    </div>
  );
}
