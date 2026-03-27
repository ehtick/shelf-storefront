import {Suspense} from 'react';
import {Await, NavLink, useRouteLoaderData} from 'react-router';
import {type CartViewPayload, RichText, useAnalytics} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {SearchIcon, ShoppingCartIcon, UserCheckIcon, UserIcon} from './icons';
import type {RootLoader} from '~/root';
import {HamburgerMenuIcon} from '@radix-ui/react-icons';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;

  const announcement = header.announcement?.nodes.filter((an) => {
    const startDate = new Date(an.startDate?.value ?? '');
    const endDate = new Date(an.endDate?.value ?? '');
    const now = new Date();
    return startDate <= now && endDate >= now;
  })[0];

  return (
    <div className="bg-white sticky top-0 z-50 border-b border-b-gray-200">
      <AnnouncementBar announcement={announcement} />
      <div className="container relative !p-1">
        <header className="header">
          <NavLink
            className="my-3"
            prefetch="intent"
            to="/"
            style={activeLinkStyle}
            end
          >
            <img
              src="/images/logo-full-color.png"
              alt={`${shop.name} logo`}
              className="h-[32px] min-w-[99px] w-[99px] rounded-none"
            />
          </NavLink>
          <HeaderMenu
            menu={menu}
            isLoggedIn={isLoggedIn}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
          <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
        </header>
      </div>
    </div>
  );
}

export function HeaderMenu({
  isLoggedIn,
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  isLoggedIn: Promise<boolean>;
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const className = `header-menu-${viewport} text-gray-700 items-center justify-center gap-4 flex w-full`;

  function closeAside(event: React.MouseEvent<HTMLAnchorElement>) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={closeAside}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={closeAside}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  const data = useRouteLoaderData<RootLoader>('root');

  return (
    <nav
      className="header-ctas items-center justify-center gap-4 flex "
      role="navigation"
    >
      <NavLink
        prefetch="intent"
        to="/account"
        style={activeLinkStyle}
        className={'whitespace-nowrap'}
      >
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) =>
              isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <span className="text-primary w-4 h-auto relative block">
                    <UserCheckIcon />
                  </span>
                  <span className="text-gray-600 hidden md:inline">
                    <Suspense fallback="User">
                      <Await
                        resolve={data?.customerData}
                        errorElement="Sign in"
                      >
                        {(customerData) => {
                          if (!customerData) {
                            return null;
                          }
                          return (
                            <span className="text-gray-600 leading-6 font-medium">
                              {customerData.data.customer.firstName}
                            </span>
                          );
                        }}
                      </Await>
                    </Suspense>
                  </span>
                </div>
              ) : (
                <div
                  className="w-5 h-auto text-gray-600 relative"
                  title="Sign in"
                >
                  <UserIcon />
                </div>
              )
            }
          </Await>
        </Suspense>
      </NavLink>
      <SearchToggle />
      <HeaderMenuMobileToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <HamburgerMenuIcon className="size-5 text-gray-600" />
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      className="reset w-5 h-auto text-gray-600 relative"
      onClick={() => open('search')}
    >
      <SearchIcon />
    </button>
  );
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      <div className="w-5 h-auto text-gray-600 relative">
        <ShoppingCartIcon />
        {count !== null && count > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 bg-primary-500 text-white text-[10px] font-medium rounded-full ring-1 ring-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>{' '}
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} />;
          return <CartBadge count={cart.totalQuantity || 0} />;
        }}
      </Await>
    </Suspense>
  );
}

function AnnouncementBar({
  announcement,
}: {
  announcement: HeaderQuery['announcement']['nodes'][number] | undefined | null;
}) {
  return announcement && announcement?.content?.value ? (
    <div className="bg-primary  border-b border-b-gray-200">
      <div className="container">
        <RichText
          data={announcement?.content.value}
          components={{
            paragraph({node}) {
              return (
                <p className="text-[14px] text-white leading-4">
                  {node.children}
                </p>
              );
            },
            list({node}) {
              return (
                <ul className="list-disc text-white list-inside text-[16px]">
                  {node.children}
                </ul>
              );
            },
          }}
          className="text-center p-4"
        />
      </div>
    </div>
  ) : null;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}
