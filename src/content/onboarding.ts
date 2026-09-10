/**
 * The guided profile build.
 *
 * Most law firm profiles fail for the same reasons, and they are not mysterious:
 * they describe the firm instead of the client's problem, they hide what things
 * cost, and they make contact feel like a commitment. Each step below exists to
 * push against one of those, and every field carries the coaching a copywriter
 * would give — including the bad example, because people recognise the mistake
 * faster than they absorb the rule.
 */

export interface FieldGuide {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "toggle" | "number" | "list" | "faq";
  placeholder?: string;
  help: string;
  /** What good looks like. */
  good?: string;
  /** What almost everyone writes instead. */
  bad?: string;
  options?: { value: string; label: string }[];
  maxLength?: number;
  optional?: boolean;
}

export interface OnboardingStep {
  key: string;
  title: string;
  /** The one idea this step is teaching. */
  principle: string;
  why: string;
  fields: FieldGuide[];
}

export const ONBOARDING: OnboardingStep[] = [
  {
    key: "promise",
    title: "Lead with their problem, not your firm",
    principle: "The visitor is scared, not shopping.",
    why:
      "Someone landing on your profile has a problem they did not choose and does not understand. They are not comparing firms on credentials yet — they are deciding whether you are the kind of practice that will take them seriously. A headline about their situation outperforms one about your history every time.",
    fields: [
      {
        name: "headline",
        label: "Headline",
        type: "text",
        maxLength: 70,
        placeholder: "Separating? Sort out the kids and the house without going to court.",
        help: "One line, addressed to the person reading it. Name their situation, not your service.",
        good: "Charged with drink driving in Geelong? Keep your licence if we can.",
        bad: "Smith & Associates — Excellence in Legal Services Since 1987",
      },
      {
        name: "intro",
        label: "Opening paragraph",
        type: "textarea",
        maxLength: 400,
        placeholder:
          "We act for people going through separation on the Mornington Peninsula. Most matters settle without a courtroom, and we will tell you honestly at the first meeting whether yours is likely to.",
        help:
          "Two or three sentences. Say who you act for, what usually happens, and what you will tell them straight. Write it the way you would say it on the phone.",
        good: "Says who it is for, what to expect, and makes a promise about honesty.",
        bad: "\"We are a full-service firm committed to delivering outstanding client outcomes.\" — this could be any firm in the country.",
      },
    ],
  },

  {
    key: "friction",
    title: "Remove the reason they don't call",
    principle: "Cost uncertainty stops more enquiries than price does.",
    why:
      "The most common reason someone does not contact a lawyer is not that they think it is too expensive — it is that they have no idea what it will cost and are afraid of being charged for asking. Firms that answer this plainly get more enquiries than firms that are cheaper but silent.",
    fields: [
      {
        name: "free_consult",
        label: "Offer a free initial consultation",
        type: "toggle",
        help:
          "The single highest-impact field on this page. It converts the person who is still deciding whether their problem is even a legal one.",
      },
      {
        name: "free_consult_mins",
        label: "How long?",
        type: "number",
        optional: true,
        placeholder: "20",
        help: "A specific number reads as a real offer. \"Free initial consultation\" reads as marketing; \"free 20-minute call\" reads as a thing you can book.",
      },
      {
        name: "fee_approach",
        label: "How you charge",
        type: "select",
        options: [
          { value: "fixed", label: "Fixed fees for most matters" },
          { value: "hourly", label: "Hourly, with an estimate up front" },
          { value: "no-win-no-fee", label: "No win no fee" },
          { value: "mixed", label: "Depends on the matter" },
        ],
        help: "Just naming your model builds trust, even before any number is attached.",
      },
      {
        name: "fee_note",
        label: "Explain it in plain English",
        type: "textarea",
        maxLength: 300,
        optional: true,
        placeholder:
          "Conveyancing is a fixed fee quoted before we start. Family matters are hourly, and we give a written estimate per stage so there are no surprises.",
        help: "You do not have to publish a price list. Explaining how the meter works is enough.",
        good: "Names which work is fixed and which is not, and promises an estimate.",
        bad: "\"Competitive rates.\" This tells the reader nothing and signals evasion.",
      },
      {
        name: "response_commitment",
        label: "How fast you reply",
        type: "select",
        optional: true,
        options: [
          { value: "same business day", label: "Same business day" },
          { value: "within 24 hours", label: "Within 24 hours" },
          { value: "within 48 hours", label: "Within 48 hours" },
        ],
        help:
          "Only promise what reception can actually deliver. A missed commitment costs more than never making one — and it will show up in your reviews.",
      },
    ],
  },

  {
    key: "proof",
    title: "Give them a reason to believe you",
    principle: "Specific beats impressive.",
    why:
      "Every firm says it is experienced. Nobody is persuaded by it. What persuades is detail a bluffer could not invent: the year you were admitted, the accreditation, the number of matters like theirs you ran last year.",
    fields: [
      {
        name: "admitted_year",
        label: "Year admitted to practice",
        type: "number",
        optional: true,
        placeholder: "2009",
        help: "A date is concrete. \"Over 15 years' experience\" is a claim; \"admitted 2009\" is a fact.",
      },
      {
        name: "principal_name",
        label: "Principal or main contact",
        type: "text",
        optional: true,
        help: "People engage a person, not a logo. Naming who they will actually deal with lifts enquiries.",
      },
      {
        name: "usps",
        label: "Three things that make you the right choice",
        type: "list",
        help:
          "Three specific claims, each one sentence. Specialisation, languages spoken, a niche you genuinely own, an unusual way you work.",
        good: "\"Accredited Family Law Specialist\" · \"We speak Mandarin and Cantonese\" · \"Fixed-fee consent orders, turned around in a week\"",
        bad: "\"Experienced\" · \"Professional\" · \"Client-focused\" — true of everyone, therefore worth nothing.",
      },
      {
        name: "memberships",
        label: "Accreditations and memberships",
        type: "list",
        optional: true,
        help:
          "Accredited Specialist, Law Society membership, industry panels. These are checkable, which is exactly why they carry weight.",
      },
    ],
  },

  {
    key: "objections",
    title: "Answer what they're too embarrassed to ask",
    principle: "The unasked question is the one that loses the enquiry.",
    why:
      "People do not ring to ask 'will you judge me', 'am I already too late', or 'can I afford this'. They just don't ring. Answering those in writing, before contact, converts the hesitant ones.",
    fields: [
      {
        name: "faqs",
        label: "Frequently asked questions",
        type: "faq",
        help:
          "Three to six. Write the questions clients actually ask on the phone, in their words — not the ones you wish they asked.",
        good: "\"What if I can't afford to pay upfront?\" · \"Do I have to go to court?\" · \"Is it too late to do anything?\"",
        bad: "\"What areas of law do you practise in?\" — nobody has ever been anxious about that.",
      },
    ],
  },

  {
    key: "presence",
    title: "Look like a real practice",
    principle: "A face and a logo outperform a placeholder every time.",
    why:
      "Profiles with a photograph get materially more enquiries than profiles without one. This is not vanity — it is the reader checking that a person exists at the other end.",
    fields: [
      {
        name: "logo_url",
        label: "Firm logo URL",
        type: "text",
        optional: true,
        placeholder: "https://yourfirm.com.au/logo.png",
        help: "Square works best. A transparent PNG sits cleanly on a dark background.",
      },
      {
        name: "photo_url",
        label: "Photo of you or the team",
        type: "text",
        optional: true,
        help:
          "A real photo beats a stock image so decisively it is not worth the debate. Faces, eye contact, natural light.",
      },
      {
        name: "abn",
        label: "ABN",
        type: "text",
        optional: true,
        placeholder: "12 345 678 901",
        help: "Shown on your profile as a verification signal. It is public information already.",
      },
    ],
  },
];

/** What to have ready before starting — shown before the claim, not after. */
export const CLAIM_CHECKLIST: { item: string; note: string }[] = [
  { item: "Your work email address", note: "At the firm's own domain if you have one — it verifies you instantly" },
  { item: "ABN", note: "For the verification badge on your profile" },
  { item: "Practising certificate details", note: "We may ask to confirm against your state's register" },
  { item: "A logo and a photo", note: "A URL to each is enough — profiles with a face get more enquiries" },
  { item: "Your practice areas", note: "Up to eight, depending on plan. Each one puts you on more suburb pages" },
  { item: "How you charge", note: "Fixed, hourly, no win no fee — naming it plainly converts better than staying quiet" },
  { item: "Payment details", note: "Card. No setup fee, no lock-in, cancel from the dashboard" },
];
