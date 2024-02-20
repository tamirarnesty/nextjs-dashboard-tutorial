'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  // NOTE: This is a client component (as denoted by the 'use client' above). Thus, we can use the `useSearchParams` and `usePathname` hooks.
  // In a server component, we need to pass these values as props (using searchParams) from the parent component. This can be found in the Page component
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // NOTE: The useDebouncedCallback hook is used to wait for a pause of 300ms before updating the URL with the new search term.
  // This prevents from searching on each keystroke, which can be expensive. This debounce limit is configurable, but a relatively low value is ideal.
  const debounceLimit = 300;
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    // When the user is typing, reset the page to 1 to show the most relevant results
    params.set('page', '1');
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, debounceLimit);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        onChange={(e) => handleSearch(e.target.value)}
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
