import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldCheck,
} from "lucide-react";

import {
  collegeInfo,
  officialContact,
  officialSourceAttribution,
} from "@/config/siteContent";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact Us | ${collegeInfo.shortInstitutionName}` },
      {
        name: "description",
        content: `Official contact numbers, address, admission helplines, and email addresses for ${collegeInfo.institutionName}.`,
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 flex flex-col gap-10">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-2 text-accent border border-border mb-3">
              <School className="size-3.5" />
              <span>Velu Nagar, Tiruvannamalai</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              Contact & Enquiry
            </h1>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-3xl">
              Get in touch with Arunai Engineering College administration, admissions cell, or academic verification department.
            </p>
          </div>
          <a
            href={officialSourceAttribution.url}
            target="_blank"
            rel="noreferrer"
            className="site-source-attribution self-start"
          >
            <ExternalLink className="size-3.5" />
            <span>{officialSourceAttribution.text}</span>
          </a>
        </div>
      </div>

      {/* Main Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Address & Campus Directions */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-3 text-accent mb-4">
              <div className="p-3 rounded-xl bg-surface-2 border border-border">
                <MapPin className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Campus Location
                </span>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Postal Address
                </h2>
              </div>
            </div>

            <p className="text-base text-foreground font-semibold mb-1">
              {officialContact.institutionName}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
              {officialContact.addressLine1}
              <br />
              {officialContact.addressLine2} – {officialContact.pincode}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Link
              to="/campus"
              className="inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl bg-accent text-on-accent font-semibold text-sm hover:opacity-95 transition-opacity"
            >
              <Compass className="size-4" />
              <span>Interactive Campus Map</span>
            </Link>
            <a
              href={officialContact.officialWebsite}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl bg-surface-2 border border-border font-semibold text-sm text-foreground hover:border-accent transition-colors"
            >
              <ExternalLink className="size-4" />
              <span>arunai.org</span>
            </a>
          </div>
        </div>

        {/* Card 2: General Enquiry Phone Lines */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-3 text-accent mb-4">
              <div className="p-3 rounded-xl bg-surface-2 border border-border">
                <Phone className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Central Exchange
                </span>
                <h2 className="font-display text-xl font-bold text-foreground">
                  General Enquiry
                </h2>
              </div>
            </div>

            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              For administrative affairs, department queries, and general campus support:
            </p>

            <div className="p-4 rounded-xl bg-surface-2 border border-border mb-6">
              <span className="text-xs text-muted-foreground block mb-1">Primary Exchange:</span>
              <strong className="text-xl sm:text-2xl font-mono text-foreground font-bold">
                {officialContact.enquiryDisplay}
              </strong>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            {officialContact.generalEnquiryPhones.map((ph) => (
              <a
                key={ph}
                href={`tel:${ph.replace(/-/g, "")}`}
                className="inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl bg-surface-2 border border-border font-semibold text-sm text-foreground hover:border-accent transition-colors"
              >
                <Phone className="size-4 text-accent" />
                <span>Call {ph}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Card 3: Admission Desk */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-3 text-accent mb-4">
              <div className="p-3 rounded-xl bg-surface-2 border border-border">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Admissions Cell
                </span>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Admission Helplines
                </h2>
              </div>
            </div>

            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Direct mobile lines for B.E., B.Tech, and MBA admissions counseling and guidance:
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 border-t border-border">
            {officialContact.admissionPhones.map((ph) => (
              <a
                key={ph}
                href={`tel:${ph}`}
                className="inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl bg-surface-2 border border-border font-mono font-semibold text-base text-foreground hover:border-accent transition-colors"
              >
                <Phone className="size-4 text-accent" />
                <span>{ph}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Card 4: Official Email & Student Verification */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-3 text-accent mb-4">
              <div className="p-3 rounded-xl bg-surface-2 border border-border">
                <Mail className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Electronic Mail
                </span>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Official Communication
                </h2>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">
                  General College Correspondence:
                </span>
                <a
                  href={`mailto:${officialContact.email}`}
                  className="font-mono text-base font-semibold text-accent underline"
                >
                  {officialContact.email}
                </a>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block mb-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-accent" />
                  Student Verification & COE:
                </span>
                <a
                  href={`mailto:${officialContact.studentVerificationEmail}`}
                  className="font-mono text-base font-semibold text-accent underline"
                >
                  {officialContact.studentVerificationEmail}
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <a
              href={`mailto:${officialContact.email}`}
              className="inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl bg-accent text-on-accent font-semibold text-sm hover:opacity-95 transition-opacity"
            >
              <Mail className="size-4" />
              <span>Compose Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
