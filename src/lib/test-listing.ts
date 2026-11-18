import type { Listing } from "./types";

/** Our own test listings. Shown with a warning banner so no one mistakes them for a real firm. */
export const isTestListing = (l: Pick<Listing, "source"> | null | undefined) => l?.source === "ace_test_seed";
