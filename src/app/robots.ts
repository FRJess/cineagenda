import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** Robots.txt: allow all, sitemap at /sitemap.xml. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  };
}
