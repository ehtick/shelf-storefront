import {Money} from '@shopify/hydrogen-react';
import {isBundledProduct} from '~/utils/products';
import type {ProductWithOptions} from '~/utils/products/types';
import type {ProductFragment} from 'storefrontapi.generated';

export const PricePerSheet = ({
  product,
  selectedVariant,
}: {
  product: ProductWithOptions;
  selectedVariant: NonNullable<ProductFragment['selectedOrFirstAvailableVariant']>;
}) => {
  const isBundled = isBundledProduct(product);

  const options = product?.options?.find((option) => option.name === 'Bundle');
  if (!isBundled || !options) {
    return null;
  }

  const selectedOptionCount = options.values.indexOf(selectedVariant.title) + 1;
  const selectedVariantPrice = Number(selectedVariant.price.amount);
  const pricePerSheet = selectedVariantPrice / selectedOptionCount;
  const labelCount = selectedVariant?.labelsAmount?.value;

  return labelCount ? (
    <div className="mt-[6px]">
      You’ll be getting a total amount of <strong>{labelCount}</strong> labels,
      costing{' '}
      <strong>
        <Money
          data={{
            amount: String(pricePerSheet),
            currencyCode: selectedVariant.price.currencyCode,
          }}
          className="inline-block"
        />
      </strong>{' '}
      per sheet.
    </div>
  ) : null;
};
