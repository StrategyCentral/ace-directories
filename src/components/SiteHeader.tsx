import { getPracticeAreas } from "@/lib/queries";
import type { PracticeArea } from "@/lib/types";
import HeaderNav from "./HeaderNav";

export default async function SiteHeader() {
  let areas: PracticeArea[] = [];
  try {
    areas = (await getPracticeAreas()).filter((a) => a.slug !== "general-practice");
  } catch {
    // Header must render even before the database is reachable.
  }
  return <HeaderNav areas={areas.slice(0, 18)} />;
}
