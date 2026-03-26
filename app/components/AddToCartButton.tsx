import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {Button} from './button';
import {useEffect} from 'react';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  onSuccess,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
  onSuccess?: (data: any) => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <ButtonWithFetcher
            fetcher={fetcher}
            disabled={disabled ?? fetcher.state !== 'idle'}
            onClick={onClick}
            onSuccess={onSuccess}
          >
            {children}
          </ButtonWithFetcher>
        </>
      )}
    </CartForm>
  );
}

function ButtonWithFetcher({
  fetcher,
  children,
  disabled,
  onClick,
  onSuccess,
}: {
  fetcher: FetcherWithComponents<any>;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  onSuccess?: (data: any) => void;
}) {
  useEffect(() => {
    const isSuccess =
      fetcher.state === 'idle' && fetcher.data && !fetcher.data.errors;

    if (isSuccess && onSuccess) {
      onSuccess(fetcher.data);
    }
  }, [fetcher.state, fetcher.data, onSuccess]);

  return (
    <Button
      type="submit"
      onClick={onClick}
      disabled={disabled ?? fetcher.state !== 'idle'}
      className="w-full"
    >
      {children}
    </Button>
  );
}
