import {useRouteLoaderData} from 'react-router';
import {Script, useNonce} from '@shopify/hydrogen';
import {useEffect} from 'react';
import {ClientOnly} from 'remix-utils/client-only';
import type {RootLoader} from '~/root';

export function NewsletterForm() {
  return (
    <iframe
      src={
        'https://dashboard.mailerlite.com/forms/523286/129012060400911590/share'
      }
      width="100%"
      height="340" // Adjust this value as needed
      title="Newsletter Signup"
    ></iframe>
  );
}
