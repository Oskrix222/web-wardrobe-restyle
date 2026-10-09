import { createFileRoute } from "@tanstack/react-router";

import { LocationPage } from "@/components/site/LocationPage";
import { locationHead } from "@/lib/location-seo";
import { locationBySlug } from "@/config/locations";

const location = locationBySlug("katowice");

export const Route = createFileRoute("/ubezpieczenia-katowice")({
  head: () => locationHead(location),
  component: () => <LocationPage location={location} />,
});
