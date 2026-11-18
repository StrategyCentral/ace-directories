/**
 * The sales side of each plan: why a firm would want it, in plain words.
 * Feature lists live in the database (`plans.features`); this is the pitch that
 * sits around them on the claim page, the pricing table and the sales page.
 * Only describe what is built.
 */
export interface PlanSell {
  /** Who it is for, one line. */
  bestFor: string;
  /** Two or three sentences on what changes for the firm. */
  pitch: string;
  /** Outcome led points, shown above the feature list. */
  wins: string[];
  /** The "one client covers it" line. */
  maths: string;
}

export const PLAN_SELL: Record<string, PlanSell> = {
  verified: {
    bestFor: "Best for sole practitioners and small firms who want their page working for them.",
    pitch:
      "Right now your page shows a name and a phone number. Verified turns it into a proper profile that you control: your website link, your words, your photo, and an enquiry form that lands in your inbox.",
    wins: [
      "People can finally click through to your website and send you an enquiry",
      "You decide what the page says about your firm, and you can change it any time",
      "You appear above every unclaimed firm in your suburb",
      "A Verified badge shows clients the firm itself stands behind the profile",
    ],
    maths:
      "Just one new client from your ALD listing would cover months of the cost, and in many practice areas the whole year.",
  },
  featured: {
    bestFor: "Best for firms that want the first look in their suburb.",
    pitch:
      "Featured puts you above every Verified and unclaimed firm on the pages people actually search, in a larger gold card that is hard to scroll past. With up to 8 practice areas you show up on far more of those pages.",
    wins: [
      "Seen first: ranked above every Verified and unclaimed firm",
      "A larger gold card that draws the eye before anyone else's",
      "Up to 8 practice areas, so you appear in more searches across your suburb",
      "A lead dashboard that shows views, phone taps and enquiries, so you can see it working",
    ],
    maths:
      "One conveyancing file or one family law matter from your ALD listing would pay for months of Featured.",
  },
};

export const sellFor = (code: string): PlanSell | null => PLAN_SELL[code] ?? null;
