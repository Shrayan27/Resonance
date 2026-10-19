import { Suspense } from "react";
import { SearchView } from "./SearchView";
import { SearchSkeleton } from "./SearchSkeleton";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchView />
    </Suspense>
  );
}
