/**
 * State-level legal context.
 *
 * Location pages need something true and specific to say, or they are just the
 * national page with a suburb name swapped in — which is exactly the thin
 * content Google discounts. Courts and regulators are the right material: they
 * genuinely differ by state, they rarely change, and they are what someone
 * actually needs to know. Deliberately no dollar figures, thresholds or time
 * limits — those move, and being wrong about them on a legal site is worse than
 * saying nothing.
 */

export interface StateContext {
  code: string;
  name: string;
  /** Courts a matter would normally be heard in, lowest to highest. */
  courts: { name: string; handles: string }[];
  tribunal: { name: string; abbr: string; handles: string };
  /** Who regulates solicitors, and where the public register lives. */
  regulator: { name: string; url: string; register: string };
  /** One or two things that are genuinely particular to this state. */
  quirks: string[];
}

export const STATE_CONTEXT: Record<string, StateContext> = {
  NSW: {
    code: "NSW",
    name: "New South Wales",
    courts: [
      { name: "Local Court of NSW", handles: "most criminal and traffic matters, and smaller civil claims" },
      { name: "District Court of NSW", handles: "serious criminal trials, appeals and larger civil claims" },
      { name: "Supreme Court of NSW", handles: "the most serious criminal matters, large commercial disputes and probate" },
    ],
    tribunal: {
      name: "NSW Civil and Administrative Tribunal", abbr: "NCAT",
      handles: "tenancy, consumer, guardianship and administrative review matters",
    },
    regulator: {
      name: "The Law Society of New South Wales",
      url: "https://www.lawsociety.com.au",
      register: "https://www.lawsociety.com.au/register-of-solicitors",
    },
    quirks: [
      "NSW is the largest legal market in the country, so specialisation runs deep — in Sydney you can usually find a firm that does nothing but your kind of matter.",
      "Contracts for the sale of residential land in NSW carry a statutory cooling-off period, which is one reason conveyancing is engaged early rather than at settlement.",
    ],
  },
  VIC: {
    code: "VIC",
    name: "Victoria",
    courts: [
      { name: "Magistrates' Court of Victoria", handles: "most criminal and traffic matters, intervention orders and smaller civil claims" },
      { name: "County Court of Victoria", handles: "serious criminal trials, appeals and most personal injury claims" },
      { name: "Supreme Court of Victoria", handles: "the most serious criminal matters, major commercial litigation and probate" },
    ],
    tribunal: {
      name: "Victorian Civil and Administrative Tribunal", abbr: "VCAT",
      handles: "tenancy, owners corporation, consumer, planning and guardianship matters",
    },
    regulator: {
      name: "Victorian Legal Services Board and Commissioner",
      url: "https://lsbc.vic.gov.au",
      register: "https://lsbc.vic.gov.au/lawyer-search",
    },
    quirks: [
      "Victoria licenses conveyancers separately from solicitors, so for a straightforward purchase you have a genuine choice between the two.",
      "Personal injury in Victoria runs through dedicated schemes — the TAC for transport accidents and WorkSafe for workplace injuries — and firms tend to specialise in one or the other.",
    ],
  },
  QLD: {
    code: "QLD",
    name: "Queensland",
    courts: [
      { name: "Magistrates Court of Queensland", handles: "most criminal and traffic matters and smaller civil claims" },
      { name: "District Court of Queensland", handles: "serious criminal trials, appeals and mid-range civil claims" },
      { name: "Supreme Court of Queensland", handles: "the most serious criminal matters, large commercial disputes and probate" },
    ],
    tribunal: {
      name: "Queensland Civil and Administrative Tribunal", abbr: "QCAT",
      handles: "tenancy, consumer, building disputes, guardianship and administrative review",
    },
    regulator: {
      name: "Queensland Law Society",
      url: "https://www.qls.com.au",
      register: "https://www.qls.com.au/Find-a-Solicitor",
    },
    quirks: [
      "Queensland is the most decentralised legal market in the country — Cairns, Townsville and the Gold Coast all support full-service firms rather than everything sitting in the capital.",
      "Residential contracts in Queensland include a statutory cooling-off period, and it is standard for a solicitor rather than a licensed conveyancer to act on the purchase.",
    ],
  },
  WA: {
    code: "WA",
    name: "Western Australia",
    courts: [
      { name: "Magistrates Court of WA", handles: "most criminal and traffic matters and smaller civil claims" },
      { name: "District Court of WA", handles: "serious criminal trials and larger civil claims" },
      { name: "Supreme Court of WA", handles: "the most serious criminal matters, major commercial litigation and probate" },
    ],
    tribunal: {
      name: "State Administrative Tribunal", abbr: "SAT",
      handles: "planning, guardianship, vocational regulation and administrative review",
    },
    regulator: {
      name: "Legal Practice Board of Western Australia",
      url: "https://www.lpbwa.org.au",
      register: "https://www.lpbwa.org.au/Public/Search-for-a-Practitioner",
    },
    quirks: [
      "Western Australia is the only state with its own dedicated Family Court — the Family Court of Western Australia — rather than sending family matters to the federal court. If your matter is in WA, look for a firm that practises there specifically.",
      "Distance matters more here than anywhere else. Many Perth firms act for clients across the whole state and are set up to run a matter without you ever attending the office.",
    ],
  },
  SA: {
    code: "SA",
    name: "South Australia",
    courts: [
      { name: "Magistrates Court of SA", handles: "most criminal and traffic matters and smaller civil claims" },
      { name: "District Court of SA", handles: "serious criminal trials, appeals and most personal injury claims" },
      { name: "Supreme Court of SA", handles: "the most serious criminal matters, large civil disputes and probate" },
    ],
    tribunal: {
      name: "South Australian Civil and Administrative Tribunal", abbr: "SACAT",
      handles: "tenancy, guardianship, housing and administrative review matters",
    },
    regulator: {
      name: "The Law Society of South Australia",
      url: "https://www.lawsocietysa.asn.au",
      register: "https://www.lawsocietysa.asn.au/Public/Find_a_Lawyer.aspx",
    },
    quirks: [
      "Adelaide's legal market is compact and concentrated in the CBD, so most South Australian firms are within walking distance of the courts.",
      "South Australia licenses conveyancers separately, and using one for a straightforward transfer is common practice.",
    ],
  },
  TAS: {
    code: "TAS",
    name: "Tasmania",
    courts: [
      { name: "Magistrates Court of Tasmania", handles: "most criminal and traffic matters and smaller civil claims" },
      { name: "Supreme Court of Tasmania", handles: "serious criminal trials, larger civil disputes, appeals and probate" },
    ],
    tribunal: {
      name: "Tasmanian Civil and Administrative Tribunal", abbr: "TASCAT",
      handles: "tenancy, guardianship, planning and administrative review matters",
    },
    regulator: {
      name: "The Law Society of Tasmania",
      url: "https://lst.org.au",
      register: "https://lst.org.au/find-a-lawyer/",
    },
    quirks: [
      "Tasmania has no intermediate court — matters go from the Magistrates Court straight to the Supreme Court, which makes the jump in seriousness a sharp one.",
      "The profession is small enough that conflicts of interest come up often in regional areas. If the firm you call says they cannot act, that is usually why.",
    ],
  },
  ACT: {
    code: "ACT",
    name: "Australian Capital Territory",
    courts: [
      { name: "ACT Magistrates Court", handles: "most criminal and traffic matters and smaller civil claims" },
      { name: "Supreme Court of the ACT", handles: "serious criminal trials, larger civil disputes and probate" },
    ],
    tribunal: {
      name: "ACT Civil and Administrative Tribunal", abbr: "ACAT",
      handles: "tenancy, unit titles, guardianship and administrative review matters",
    },
    regulator: {
      name: "ACT Law Society",
      url: "https://www.actlawsociety.asn.au",
      register: "https://www.actlawsociety.asn.au/for-the-public/find-a-lawyer",
    },
    quirks: [
      "The ACT has an unusually high concentration of firms doing Commonwealth and administrative law work, because that is where the agencies are.",
      "Territory land is held under long-term Crown lease rather than freehold, which makes the conveyancing process meaningfully different from the states.",
    ],
  },
  NT: {
    code: "NT",
    name: "Northern Territory",
    courts: [
      { name: "Local Court of the Northern Territory", handles: "most criminal and traffic matters and smaller civil claims" },
      { name: "Supreme Court of the Northern Territory", handles: "serious criminal trials, larger civil disputes and probate" },
    ],
    tribunal: {
      name: "Northern Territory Civil and Administrative Tribunal", abbr: "NTCAT",
      handles: "tenancy, guardianship and administrative review matters",
    },
    regulator: {
      name: "Law Society Northern Territory",
      url: "https://lawsocietynt.asn.au",
      register: "https://lawsocietynt.asn.au/for-the-public/find-a-lawyer.html",
    },
    quirks: [
      "The Territory's courts circuit to remote communities, so where your matter is heard may not be Darwin or Alice Springs.",
      "It is the smallest profession in the country. Firms here tend to be genuine generalists rather than specialists, which is worth knowing when you call.",
    ],
  },
};

export const stateContext = (code?: string | null) =>
  (code && STATE_CONTEXT[code]) || null;
