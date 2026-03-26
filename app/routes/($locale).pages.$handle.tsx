import {type LoaderFunctionArgs} from 'react-router';
import {Form, useLoaderData, type MetaFunction} from 'react-router';
import {appendToMetaTitle} from '~/utils/append-to-meta-title';
import {Button} from '~/components/button';
import {z} from 'zod';
import {useZorm} from 'react-zorm';
import Input from '~/components/form/input';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: appendToMetaTitle(data?.page.title ?? '')}];
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params}: LoaderFunctionArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

const ContactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

export default function Page() {
  const {page} = useLoaderData<typeof loader>();
  const zo = useZorm('NewQuestionWizardScreen', ContactSchema);

  return (
    <div className="page">
      <div className="container my-16">
        <header>
          <h1 className="mx-auto max-w-[400px]">{page.title}</h1>
        </header>
        <main dangerouslySetInnerHTML={{__html: page.body}} />

        {page.handle === 'contact' && (
          <Form
            method="post"
            action="/api/contact"
            ref={zo.ref}
            className="mx-auto"
          >
            <Input
              name={zo.fields.name()}
              error={zo.errors.name()?.message}
              label={'Name'}
              required
            />

            <Input
              name={zo.fields.email()}
              error={zo.errors.email()?.message}
              label={'Email'}
              required
            />

            <Input
              name={zo.fields.name()}
              error={zo.errors.name()?.message}
              label={'Message'}
              required
              inputType="textarea"
            />

            <Button type="submit" className="mt-2">
              Submit
            </Button>
          </Form>
        )}
      </div>
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
      handle
      seo {
        description
        title
      }
    }
  }
` as const;
