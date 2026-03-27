import {ChevronRightIcon} from '@radix-ui/react-icons';
import {Link, useMatches} from 'react-router';
import {tw} from '~/utils/tw';
import type {Collection, Product} from '@shopify/hydrogen/storefront-api-types';
import {ChevronLeft} from 'lucide-react';

// Define an interface that extends RouteHandle with the 'breadcrumb' property
interface HandleWithBreadcrumb {
  breadcrumbType?: 'collections' | 'collection' | 'product'; // Change 'any' to the actual type of 'breadcrumb' if known
}

export function Breadcrumbs() {
  const matches = useMatches();
  const currentRoute = matches.at(-1);
  const breadcrumbType = (currentRoute?.handle as HandleWithBreadcrumb)
    ?.breadcrumbType;
  const breadcrumbs: Breadcrumb[] = [{href: '/', label: 'Shop'}];

  switch (breadcrumbType) {
    case 'product': {
      // @ts-ignore - need to figure out how to get the type of the currentRoute on hydrogen
      const product = currentRoute?.data?.product as Product;
      const collection = product?.collections?.nodes[0] as Collection;
      breadcrumbs.push({
        href: `/collections/${collection.handle}`,
        label: collection.title,
      });
      breadcrumbs.push({
        href: `/products/${product?.handle}`,
        label: product?.title,
      });
      break;
    }
    default:
      break;
  }

  return (
    <div className="breadcrumbs mb-4 md:mb-[26px] flex max-w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
      {breadcrumbs.map((breadcrumb, index) => (
        <Breadcrumb
          key={breadcrumb.href}
          breadcrumb={breadcrumb}
          index={index}
          breadcrumbsLength={breadcrumbs.length}
        />
      ))}
    </div>
  );
}

type Breadcrumb = {
  href: string;
  label: string;
};

const Breadcrumb = ({
  breadcrumb,
  index,
  breadcrumbsLength,
}: {
  breadcrumb: Breadcrumb;
  index: number;
  breadcrumbsLength: number;
}) => {
  const isLastItem = index === breadcrumbsLength - 1;
  const isFirstItem = index === 0;
  /** We need this for mobile as this is the only item we will display on mobile */
  const isSecondToLast = index === breadcrumbsLength - 2;
  return (
    <div
      className={tw(
        'breadcrumb',
        isLastItem ? 'truncate' : '',
        isSecondToLast && 'w-full md:w-auto',
      )}
    >
      <Link
        to={isLastItem ? '' : breadcrumb.href}
        className={tw(
          'text-[14px] font-medium',
          !isLastItem
            ? 'text-gray-600 hover:text-gray-600 hover:underline'
            : 'text-primary-500 hover:text-primary-500 pointer-events-none',
          // This handles mobile
          !isSecondToLast
            ? 'hidden md:inline'
            : 'text-primary-500 hover:text-primary-500 md:text-gray-600 md:hover:text-gray-600 hover:underline flex items-center md:inline ml-[-6px] md:ml-0',
        )}
      >
        {isSecondToLast && (
          <ChevronLeft className="inline align-middle text-primary-500 md:hidden" />
        )}
        {breadcrumb.label}
      </Link>
      {!isLastItem && (
        <span className="mx-2.5 md:mx-3 hidden md:inline">
          <ChevronRightIcon className="inline align-middle" />
        </span>
      )}
    </div>
  );
};
