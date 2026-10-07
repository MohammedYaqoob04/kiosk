import { createFileRoute } from "@tanstack/react-router";

import { SiteHome } from "@/components/site/SiteHome";
import "@/components/site/site-home.css";
import { siteContent } from "@/config/siteContent";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteContent.projectName} | ${siteContent.institutionName}` },
      {
        name: "description",
        content: `${siteContent.institutionName} - ${siteContent.departmentName}.`,
      },
    ],
  }),
  component: SiteHome,
});
