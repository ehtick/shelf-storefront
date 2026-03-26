import {useNavigate} from '@remix-run/react';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import {twMerge} from 'tailwind-merge';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {PricePerSheet} from './product/price-per-sheet';
import {useState} from 'react';
import {QuantitySelector} from './product/quantity-selector';
import type {FileWithPreview} from './product/file-upload-dropzone';
import FileUploadDropzone from './product/file-upload-dropzone';
import {assertIsCustomizedProduct} from '~/utils/products';

export function ProductForm({
  product,
  productOptions,
  selectedVariant,
}: {
  product: ProductFragment;
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [quantity, setQuantity] = useState(1);
  const isCustomizedProduct = assertIsCustomizedProduct(product);

  /** State for custom products */
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');

  return (
    <div className="">
      {productOptions.map((option) => {
        if (option.optionValues.length <= 1) return null;
        return (
          <div className="mt-6" key={option.name}>
            <h5 className="text-gray-700 text-[14px] font-medium mb-[6px]">
              {option.name}
            </h5>
            <div className="flex items-center justify-normal border border-gray-200 rounded-[4px] p-1 bg-gray-50 w-fit">
              {option.optionValues.map((value) => {
                const {
                  name,
                  variantUriQuery,
                  selected,
                  available,
                  isDifferentProduct,
                  handle,
                } = value;

                if (isDifferentProduct) {
                  return (
                    <a
                      className={twMerge(
                        'text-[14px] font-semibold py-2 px-3 rounded-[3px] hover:no-underline',
                        selected
                          ? 'bg-white text-gray-700 shadow-md'
                          : 'bg-gray-10 text-gray-500',
                        !available && 'opacity-50',
                      )}
                      key={option.name + name}
                      href={`/products/${handle}?${variantUriQuery}`}
                    >
                      {name}
                    </a>
                  );
                }

                return (
                  <button
                    type="button"
                    className={twMerge(
                      'text-[14px] font-semibold py-2 px-3 rounded-[3px] hover:no-underline',
                      selected
                        ? 'bg-white text-gray-700 shadow-md'
                        : 'bg-gray-10 text-gray-500',
                      !available && 'opacity-50',
                    )}
                    key={option.name + name}
                    onClick={() => {
                      if (!selected) {
                        navigate(`?${variantUriQuery}`, {replace: true});
                      }
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {selectedVariant && (
        <PricePerSheet product={product} selectedVariant={selectedVariant} />
      )}

      <br />
      {/* Logo upload dropzone */}
      {isCustomizedProduct && (
        <FileUploadDropzone
          uploadedFileUrl={uploadedFileUrl}
          setUploadedFileUrl={setUploadedFileUrl}
          file={file}
          setFile={setFile}
        />
      )}
      <br />

      <div className="flex gap-2 items-center">
        <div className="flex-1 [&>form]:w-full [&>form]:max-w-full">
          <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={() => {
              open('cart');
            }}
            lines={
              selectedVariant
                ? [
                    {
                      merchandiseId: selectedVariant.id,
                      quantity,
                      selectedVariant,
                      ...(isCustomizedProduct &&
                        uploadedFileUrl !== '' && {
                          attributes: [
                            {
                              key: 'logo',
                              value: uploadedFileUrl,
                            },
                          ],
                        }),
                    },
                  ]
                : []
            }
            /**
             * When adding a product to the cart, we clean up the file from the state
             */
            onSuccess={(data) => {
              if (isCustomizedProduct && data?.action === 'LinesAdd') {
                setUploadedFileUrl('');
                setFile(null);
              }
            }}
          >
            {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
          </AddToCartButton>
        </div>
        <QuantitySelector state={[quantity, setQuantity]} />
      </div>
      {isCustomizedProduct && (
        <div>
          Expected production time for custom labels is{' '}
          <strong>10 working days</strong> from the time of placing your order
          to delivery.
        </div>
      )}
    </div>
  );
}
