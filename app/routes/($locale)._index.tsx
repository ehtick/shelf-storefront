import {type LoaderFunctionArgs} from 'react-router';
import {useLoaderData, type MetaFunction, Await} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {appendToMetaTitle} from '~/utils/append-to-meta-title';
import {Button} from '~/components/button';
import type {FeaturedCollectionFragment} from 'storefrontapi.generated';
import {TestimonialsSlider} from '~/components/marketing/testimonials-slider';
import {
  HOMEPAGE_CONTENT_FRAGMENT,
  MEDIA_IMAGE_FRAGMENT,
  PUBLISHED_TESTIMONIALS_FRAGMENT,
} from '~/lib/fragments';
import {Suspense} from 'react';
import {ProductCard} from '~/components/product/product-card';
import {ThreeColumns} from '~/components/generic/three-columns';
import {WarrantySection} from '~/components/generic/warranty-section';
import {Benefits} from '~/components/marketing/benefits';
import {SocialTrust} from '~/components/marketing/social-trust';
import {ApplicationShowcase} from '~/components/marketing/application-showcase';
import {HereToHelp} from '~/components/marketing/here-to-help';

export const meta: MetaFunction = () => {
  return [{title: appendToMetaTitle('Home')}];
};

export type IndexLoader = typeof loader;

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);
  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {
    ...deferredData,
    ...criticalData,
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: LoaderFunctionArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    featuredCollection: collections.nodes[0],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  const homepageContent = context.storefront
    .query(HOMEPAGE_CONTENT_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    homepageContent,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const {homepageContent} = data;
  return (
    <div className="home">
      <FeaturedCollection collection={data.featuredCollection} />
      <SocialTrust />
      <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <Await resolve={homepageContent}>
          {(response) => {
            if (!response) return null;

            const threeColumnsSection =
              response?.homepageContent?.nodes[0].fields.find(
                (field) => field.key === 'three_columns_section',
              );
            const warrantySection =
              response?.homepageContent?.nodes[0].fields.find(
                (field) => field.key === 'warranty_section',
              );

            return (
              <div className="homepage-sections">
                {warrantySection?.reference && (
                  <WarrantySection content={warrantySection.reference} />
                )}
                <ApplicationShowcase />
                <HereToHelp />

                {threeColumnsSection?.reference && (
                  <ThreeColumns content={threeColumnsSection.reference} />
                )}

                {response?.testimonials && (
                  <TestimonialsSlider
                    testimonials={response?.testimonials?.nodes || null}
                  />
                )}
              </div>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;

  const image = collection?.image;
  return (
    <>
      <div
        className="py-8 md:py-24 overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, #FFFFFF 100%)',
          backgroundImage: `url(/images/bg-overlay1.png)`,
        }}
      >
        <div className="container">
          <div className="flex items-center relative">
            <div className="max-w-[560px] w-full p-[40px] z-20 shadow-3xl border border-gray-200 bg-white rounded-lg [&_h1]:mb-6 [&_h1]:mt-4 [&_p]:mb-4">
              <img
                src="/images/logo-full-color.png"
                alt={`Shelf logo`}
                className="h-[32px] w-[99px] rounded-none"
              />
              <div
                dangerouslySetInnerHTML={{__html: collection.descriptionHtml}}
              />
              <Button to="collections/all">Shop now</Button>
            </div>
            {image && (
              <>
                <div className="featured-collection-image z-10  h-[720px] w-full flex-1 ml-[-200px] r-0 overflow-hidden">
                  <img
                    src={'/images/sea-shepherd-camera-operator.jpeg'}
                    alt="Sea Shepherd camera operator"
                    sizes="100vw"
                    className="object-center object-cover h-full w-full"
                  />
                </div>
                <div className="text-right font-mono absolute bottom-[-20px] right-0 text-[12px]">
                  Paula Moreno - Sea Shepherd Content Crew - Manages equipment
                  with Shelf.
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Benefits />

      <div className="container">
        <div className="flex justify-between items-center pt-24 pb-16">
          <h2 className="">{collection.title}</h2>
          <Button to="collections/all" variant="secondary">
            View all products
          </Button>
        </div>
        <div className="featured-products-grid pb-24">
          {collection?.products?.nodes.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </div>
    </>
  );
}

const FEATURED_COLLECTION_FRAGMENT = `#graphql
  fragment FeaturedCollection on Collection {
    id
    handle
    title
    description
    descriptionHtml
    image {
      id
      url
      altText
      width
      height
    }
    handle
    products(first: 4) {
      nodes{
        id
        title
        handle
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 2) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
  }
  ` as const;

const FEATURED_COLLECTION_QUERY = `#graphql
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(query: "handle:frontpage", first: 1) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
  ${FEATURED_COLLECTION_FRAGMENT}
` as const;

export const HOMEPAGE_CONTENT_QUERY = `#graphql
  query HomepageContent($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    ...Testimonials
    ...HomepageContent
  }
  ${PUBLISHED_TESTIMONIALS_FRAGMENT}
  ${MEDIA_IMAGE_FRAGMENT}
  ${HOMEPAGE_CONTENT_FRAGMENT}
` as const;
