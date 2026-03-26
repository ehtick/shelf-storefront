import {Image, Money} from '@shopify/hydrogen';
import type {FeaturedCollectionFragment} from 'storefrontapi.generated';
import {Link} from 'react-router';

export const ProductCard = ({
  product,
}: {
  product: Pick<
    FeaturedCollectionFragment['products']['nodes'][number],
    'handle' | 'title' | 'priceRange' | 'images'
  >;
}) => {
  const mainImage = product.images.nodes[0];
  const hoverImage = product.images.nodes[1];

  return (
    <Link
      to={`/products/${product.handle}`}
      className="group max-w-full product-card border border-gray-200 rounded-lg hover:!no-underline transition-all duration-500 ease-in-out"
    >
      <div className="relative h-auto aspect-square overflow-hidden">
        {' '}
        {/* Wrap images in a relative container */}
        <Image
          data={mainImage}
          aspectRatio="1/1"
          sizes="(min-width: 45em) 20vw, 50vw"
          className="absolute inset-0 w-full h-full main-image transition-opacity duration-500 ease-in-out"
        />
        <Image
          data={hoverImage}
          aspectRatio="1/1"
          sizes="(min-width: 45em) 20vw, 50vw"
          className="absolute inset-0 w-full h-full hover-image opacity-0 scale-100 transition-all duration-500 ease-in-out transform group-hover:opacity-100 group-hover:scale-105"
        />
      </div>
      <div className="p-5 text-center border-t border-t-gray-200">
        <h4 className="font-medium text-[16px] leading-[20px] text-gray-900 ">
          {product.title}
        </h4>
        <div className="text-gray-600 text-[16px] font-normal">
          <Money data={product.priceRange.minVariantPrice} />
        </div>
      </div>
    </Link>
  );
};
