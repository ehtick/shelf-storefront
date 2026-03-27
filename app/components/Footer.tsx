import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {tw} from '~/utils/tw';
import {NewsletterForm} from './marketing/newsletter-form';
import {HeartHandshake, Package, ShieldCheck, Truck} from 'lucide-react';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  return (
    <footer className="border-t">
      <NewsletterForm />
      {/* Features Grid */}
      <div className="border-y border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 rounded-full p-2">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Free Shipping</h3>
                <p className="text-sm text-gray-600">On orders over $150</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-50 rounded-full p-2">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Fast Delivery</h3>
                <p className="text-sm text-gray-600">
                  2-5 business days (for unbranded labels)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 rounded-full p-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Secure Payment</h3>
                <p className="text-sm text-gray-600">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 rounded-full p-2">
                <HeartHandshake className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium">Dedicated Support</h3>
                <p className="text-sm text-gray-600">Here to help 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Suspense>
        <Await resolve={footerPromise}>
          {(footer) => {
            return (
              footer?.menu &&
              header.shop.primaryDomain?.url && (
                <FooterMenu
                  menu={footer.menu}
                  primaryDomainUrl={header.shop.primaryDomain.url}
                  publicStoreDomain={publicStoreDomain}
                />
              )
            );
          }}
        </Await>
      </Suspense>
      <div className="flex items-center justify-center border-t p-8 text-gray-500 font-normal">
        © {new Date().getFullYear()} Shelf.nu. All rights reserved.
      </div>
    </footer>
  );
}

function FooterMenu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: FooterQuery['menu'];
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
}) {
  const linkClasses = tw('text-gray-600');
  return (
    <div className="container">
      <nav
        className="flex flex-col md:flex-row gap-8 items-center justify-center  my-12 font-semibold"
        role="navigation"
      >
        {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
          if (!item.url) return null;
          // if the url is internal, we strip the domain
          const url =
            item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
              ? new URL(item.url).pathname
              : item.url;
          const isExternal = !url.startsWith('/');
          return isExternal ? (
            <a
              href={url}
              key={item.id}
              rel="noopener noreferrer"
              target="_blank"
              className={linkClasses}
            >
              {item.title}
            </a>
          ) : (
            <NavLink
              end
              key={item.id}
              prefetch="intent"
              to={url}
              className={linkClasses}
            >
              {item.title}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};
