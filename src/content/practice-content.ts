/**
 * Editorial content for the practice-area silos.
 *
 * Written to be genuinely useful to someone who has never hired a lawyer, since
 * that is who lands on these pages. No dollar figures or time limits — those
 * change, they vary by state, and being confidently wrong about them on a legal
 * directory is worse than saying nothing. Cost sections describe how firms
 * charge, not what they charge.
 */

export interface Faq {
  q: string;
  a: string;
}

export interface PracticeContent {
  /** Two or three paragraphs. First one has to earn the scroll. */
  intro: string[];
  whatTheyDo: string[];
  whenToCall: string[];
  costNote: string;
  chooseTips: { title: string; body: string }[];
  faqs: Faq[];
}

const C = (c: PracticeContent) => c;

export const PRACTICE_CONTENT: Record<string, PracticeContent> = {
  "family-lawyers": C({
    intro: [
      "Family law covers what happens to children, property and money when a relationship ends. It applies to married and de facto couples alike, and — with the exception of Western Australia, which runs its own Family Court — it is federal law, so the rules are the same wherever in Australia you live.",
      "Most family matters never see a courtroom. The system is built to push separating couples toward agreement first, through negotiation and compulsory family dispute resolution, and a good family lawyer spends far more time settling matters than arguing them.",
    ],
    whatTheyDo: [
      "Divorce applications and the paperwork that goes with them",
      "Parenting arrangements — where children live, how time is shared, who decides what",
      "Dividing property, superannuation and debts after separation",
      "Binding financial agreements, both before and during a relationship",
      "Consent orders, so an agreement you have already reached becomes enforceable",
      "Family violence intervention and protection orders",
      "Child support disputes and departures from the standard assessment",
    ],
    whenToCall: [
      "You have separated, or you are seriously considering it",
      "You cannot agree on where the children live or how time is shared",
      "There is property, a business or superannuation to divide",
      "You have been served with court documents and there is a date on them",
      "You feel unsafe, or a protection order has been applied for against you",
    ],
    costNote:
      "Family lawyers usually charge by the hour, often with a fixed fee for discrete pieces of work like a divorce application or consent orders. Ask for a written costs agreement before you start, and ask specifically what happens to the estimate if the matter has to go to court — that is where the range widens most.",
    chooseTips: [
      { title: "Accreditation is a real signal", body: "Several state law societies accredit specialists in family law. It is not a guarantee, but it means someone has been assessed on this area specifically." },
      { title: "Ask how they resolve matters", body: "A firm that settles most of its files will say so. If the answer is vague, ask what proportion of their matters end in a contested hearing." },
      { title: "Match the lawyer to the matter", body: "A straightforward divorce with no children and no property does not need the most expensive litigator in town." },
    ],
    faqs: [
      { q: "Do I need a lawyer to get divorced?", a: "No. A divorce application can be filed without one, and where there are no children under 18 and nothing to divide, many people do it themselves. Lawyers matter far more for the property and parenting questions, which are separate from the divorce itself." },
      { q: "How long do I have to sort out property after separating?", a: "There are time limits, and they differ depending on whether you were married or in a de facto relationship. They are strict enough that it is worth asking a lawyer early rather than assuming you have time." },
      { q: "Will we have to go to court?", a: "Usually not. In most cases you are required to attempt family dispute resolution before a court will hear a parenting matter, and the majority of separations are resolved by agreement." },
      { q: "Can one lawyer act for both of us?", a: "No. A lawyer can only act for one party — the interests are opposed. If you have reached agreement between yourselves, one of you can instruct a lawyer to draft consent orders and the other should have them independently reviewed." },
    ],
  }),

  "criminal-lawyers": C({
    intro: [
      "A criminal lawyer defends people who have been charged with an offence, from a first-time drink driving charge through to the most serious matters heard in a Supreme Court. Criminal law is state law, so both the offences and the sentencing rules differ depending on where you were charged.",
      "The single most useful thing to know is that the earliest stage matters most. What you say in a police interview is difficult to undo later, and you are entitled to legal advice before you answer questions.",
    ],
    whatTheyDo: [
      "Advice before and during a police interview",
      "Bail applications and variations",
      "Pleas in mitigation, where the aim is the best possible sentence",
      "Defended hearings and trials",
      "Appeals against conviction or sentence",
      "Applications to have a matter dealt with without a conviction recorded",
    ],
    whenToCall: [
      "Police have asked you to attend an interview — before you attend, not after",
      "You have been charged, or given a court attendance notice",
      "You are in custody and need a bail application",
      "You have a court date and no idea what happens on the day",
      "You want to appeal a sentence — these have short deadlines",
    ],
    costNote:
      "Criminal matters are often quoted as a fixed fee per stage: one price for a plea, another for a defended hearing, another for each day of trial. Ask what is included and what happens if the matter is adjourned. If you cannot afford private representation, Legal Aid in your state may be able to act, and duty lawyers are available at most courts on the day.",
    chooseTips: [
      { title: "Local court experience counts", body: "Criminal practice is intensely local. A lawyer who appears in the court your matter is listed in knows the prosecutors, the magistrates and how things run there." },
      { title: "Be wary of anyone promising an outcome", body: "No lawyer can guarantee a result. A good one will tell you the realistic range and what would move you within it." },
      { title: "Ask who will actually appear", body: "In larger firms the person you meet is not always the person who turns up. Ask." },
    ],
    faqs: [
      { q: "Should I talk to police without a lawyer?", a: "You are generally entitled to obtain legal advice before participating in an interview, and most criminal lawyers would say take it. Beyond identifying yourself, you are usually not obliged to answer questions — but the rules differ by state and by offence, so get advice on your specific situation." },
      { q: "What if I can't afford a lawyer?", a: "Legal Aid in every state and territory provides assistance for serious criminal matters, subject to a means and merits test. Most courts also have a duty lawyer who can help on the day, and community legal centres offer free advice." },
      { q: "Will a charge show up on a police check?", a: "It depends on the outcome, the offence and the state. In some circumstances a court can deal with a matter without recording a conviction. This is one of the main things a lawyer argues for, so raise it early." },
      { q: "Can I change lawyers partway through?", a: "Yes. You are entitled to change representation, though it may cause delay and you will need to settle fees for work already done." },
    ],
  }),

  "conveyancers": C({
    intro: [
      "Conveyancing is the legal side of buying or selling property: checking the contract before you sign, running the searches that reveal what you are actually buying, and getting the title transferred at settlement.",
      "It is the one legal service most Australians will use, and the point at which it adds most value is before you sign — not after. Once a contract is signed, the room to fix a problem narrows considerably.",
    ],
    whatTheyDo: [
      "Reviewing the contract and vendor's statement before you sign",
      "Ordering and interpreting title, planning, rates and authority searches",
      "Explaining what the special conditions actually commit you to",
      "Negotiating amendments to the contract",
      "Coordinating settlement with your lender and the other side",
      "Attending to the transfer of title and stamp duty",
    ],
    whenToCall: [
      "You are about to sign a contract or bid at auction — before, ideally",
      "You have signed and are within a cooling-off period",
      "You are selling and need the contract and disclosure documents prepared",
      "Something in the contract does not make sense to you",
      "Settlement is approaching and your lender is not ready",
    ],
    costNote:
      "Conveyancing is usually a fixed professional fee plus disbursements — the searches, registration and duty paid on your behalf. The fee is the small number; the disbursements vary. Ask for a quote that separates the two, so you can compare like with like.",
    chooseTips: [
      { title: "Solicitor or licensed conveyancer", body: "In several states you can use either. A licensed conveyancer handles the transaction; a solicitor can also advise if something turns into a dispute. For anything unusual — a subdivision, a deceased estate, a business attached to the property — lean toward a solicitor." },
      { title: "Ask about their settlement volume", body: "This is high-volume work where practice makes a real difference. A firm doing this every day will spot a problem clause faster." },
      { title: "Check they act in your state", body: "Property law is state law and the documents differ. Use someone who practises where the property is." },
    ],
    faqs: [
      { q: "Do I need a conveyancer before I bid at auction?", a: "Yes — auction purchases generally have no cooling-off period, so the contract review has to happen beforehand. Once the hammer falls you are bound." },
      { q: "What is the difference between a conveyancer and a solicitor?", a: "A licensed conveyancer is qualified specifically for property transfers. A solicitor can do the same work and also advise on wider legal issues if the transaction goes wrong. Not every state licenses conveyancers separately." },
      { q: "How long does settlement take?", a: "The period is set by the contract and commonly runs several weeks from signing, though it is negotiable. Delays usually come from finance rather than the legal work." },
      { q: "What are searches for?", a: "They reveal things the listing will not — easements, planning overlays, unapproved building work, outstanding rates. They are how you find out what you are actually buying." },
    ],
  }),

  "wills-estates-lawyers": C({
    intro: [
      "Wills and estates covers two distinct situations: planning what happens to your assets, and dealing with someone else's estate after they die. The same firms usually do both.",
      "The planning half is cheap and quick. The administration half is neither, and how much of it you face is largely determined by how well the planning was done.",
    ],
    whatTheyDo: [
      "Drafting wills, including for blended families and business owners",
      "Enduring powers of attorney and guardianship appointments",
      "Applying for probate or letters of administration",
      "Administering an estate and distributing it to beneficiaries",
      "Contesting a will, or defending an estate against a claim",
      "Testamentary trusts and estate planning where tax or asset protection matters",
    ],
    whenToCall: [
      "You have children, property or a business and no valid will",
      "Your circumstances have changed — married, separated, a death in the family",
      "Someone has died and you are named as executor",
      "You have been left out of a will, or left less than you expected",
      "A family member is losing capacity and nothing is in place",
    ],
    costNote:
      "A straightforward will is usually a modest fixed fee, and powers of attorney are often bundled with it. Estate administration is different — commonly charged hourly or as a percentage of the estate, and paid from the estate rather than by you personally. Contested estates are litigation and priced accordingly.",
    chooseTips: [
      { title: "Cheap wills get expensive later", body: "Most contested estates trace back to a will that was unclear, out of date, or made without advice. The saving at the front end is small relative to what a dispute costs." },
      { title: "Ask about your specific complication", body: "Blended family, a self-managed super fund, a farm, a business, someone with a disability — each changes the drafting. Say so on the first call." },
      { title: "Executors can get help", body: "If you have been named executor and it feels overwhelming, a firm can do as much or as little of the administration as you want." },
    ],
    faqs: [
      { q: "Is a DIY will kit valid?", a: "It can be, if executed correctly. The common failures are witnessing errors and unclear wording, and both surface only after death when they cannot be fixed. For anything beyond the very simplest estate, the risk is poorly balanced against the saving." },
      { q: "What is probate?", a: "A court order confirming a will is valid and that the executor can deal with the estate. Whether it is required depends on what the estate holds — banks and land titles offices set their own thresholds." },
      { q: "Who can contest a will?", a: "Broadly, people the deceased had a responsibility to provide for — spouses, children and sometimes others who were dependent. The categories and time limits are set by state law and the deadlines are short." },
      { q: "Does my will cover my superannuation?", a: "Often not automatically. Superannuation is usually dealt with by a binding death benefit nomination made with your fund, separately from your will. It is one of the most common gaps in an otherwise sound plan." },
    ],
  }),

  "personal-injury-lawyers": C({
    intro: [
      "Personal injury lawyers pursue compensation for people hurt in car accidents, at work, in public places or through medical treatment that went wrong. Which scheme applies depends on how and where you were injured, and the schemes differ substantially between states.",
      "Almost all of this work is done on a no win no fee basis, which means the barrier to getting advice is low. Getting advice early matters because these claims run on strict time limits.",
    ],
    whatTheyDo: [
      "Motor vehicle accident claims through the relevant state scheme",
      "Workers compensation claims, and common law claims where available",
      "Public liability — injuries in shops, on footpaths, at venues",
      "Medical negligence claims",
      "Total and permanent disability and income protection claims through superannuation",
      "Disputes about the level of impairment assessed",
    ],
    whenToCall: [
      "You have been injured and someone else may be responsible",
      "Your workers compensation claim has been rejected or cut off",
      "You have been offered a settlement and do not know if it is fair",
      "An insurer is asking you to attend an examination",
      "You have been injured and are unsure whether you have a claim at all",
    ],
    costNote:
      "No win no fee is standard, meaning professional fees are only payable if the claim succeeds. That is not the same as free — ask specifically about disbursements such as medical reports, whether you are liable for them if the claim fails, and how any uplift fee works. Costs agreements in this area are heavily regulated, and a good firm will walk you through it.",
    chooseTips: [
      { title: "Scheme experience is the thing", body: "Motor accident, workers compensation and medical negligence are effectively different jobs with different rules. Ask how many claims like yours the firm ran last year." },
      { title: "Understand the fee structure fully", body: "Ask what you would owe if you discontinued halfway, and what happens to disbursements. Get it in writing." },
      { title: "Do not wait", body: "Time limits in this area are unforgiving, and evidence gets harder to gather as memories fade and scenes change." },
    ],
    faqs: [
      { q: "What does no win no fee actually mean?", a: "The firm's professional fees are only payable if you win or settle. Disbursements — medical reports, court filing fees, expert opinions — are treated separately, and whether you carry those if the claim fails varies between firms. Ask directly." },
      { q: "How long do I have to make a claim?", a: "Time limits vary by state and by the type of claim, and some require notice within a short period of the injury. Assume the clock is running and get advice early." },
      { q: "Will I have to go to court?", a: "Most personal injury claims settle. Many resolve at a compulsory conference or mediation before proceedings are even needed." },
      { q: "Can I claim if I was partly at fault?", a: "Often yes, though compensation may be reduced to reflect your share of responsibility. Being partly at fault is rarely a reason not to get advice." },
    ],
  }),

  "employment-lawyers": C({
    intro: [
      "Employment lawyers deal with the relationship between employer and employee — how it is set up, how it goes wrong and how it ends. Most of this sits under the federal Fair Work system, so the framework is largely national.",
      "The defining feature of this area is speed. Unfair dismissal and general protections applications have very short deadlines measured in days rather than months, and missing one usually ends the claim.",
    ],
    whatTheyDo: [
      "Unfair dismissal and general protections claims",
      "Employment contracts, restraint of trade and confidentiality clauses",
      "Workplace bullying, discrimination and sexual harassment complaints",
      "Underpayment and misclassification claims",
      "Redundancy — whether it was genuine and whether the process was followed",
      "Advising employers on performance management, investigations and terminations",
    ],
    whenToCall: [
      "You have been dismissed — immediately, because the clock is short",
      "You have been offered a deed of release and asked to sign quickly",
      "You are being performance managed and it feels like the exit has been decided",
      "A restraint clause is stopping you taking a new job",
      "You are an employer about to terminate someone and want the process right",
    ],
    costNote:
      "Employment matters are usually hourly, though many firms offer a fixed-fee initial advice for a dismissal — reviewing the facts and telling you whether there is a claim. Some act on a conditional basis for stronger claims. Ask what the fee covers up to conciliation, since a large share of matters resolve there.",
    chooseTips: [
      { title: "Get advice before you sign anything", body: "Deeds of release are usually final. Once signed, the claim is gone, and they are often presented with a short deadline for exactly that reason." },
      { title: "Employee-side or employer-side", body: "Many firms lean one way. Both are legitimate, but a firm that acts mostly for employers brings a particular perspective to your dismissal." },
      { title: "Bring the paperwork", body: "Contract, position description, warnings, the termination letter and any relevant emails. Advice is only as good as the documents behind it." },
    ],
    faqs: [
      { q: "How long do I have to lodge an unfair dismissal claim?", a: "The window is short — a matter of weeks from when the dismissal took effect, and the Fair Work Commission only extends it in exceptional circumstances. Treat it as urgent." },
      { q: "Can I be sacked without warning?", a: "It depends on the reason. Serious misconduct can justify immediate dismissal, but in most other cases an employer is expected to give notice and follow a fair process. Whether the process was fair is often the whole argument." },
      { q: "Are restraint of trade clauses enforceable?", a: "Sometimes. Courts enforce restraints only so far as they reasonably protect a legitimate business interest. Many drafted clauses are wider than a court would uphold, but that is not something to assume without advice." },
      { q: "What is the difference between unfair dismissal and general protections?", a: "Unfair dismissal is about whether the dismissal was harsh, unjust or unreasonable. General protections concern dismissal for a prohibited reason — such as exercising a workplace right or a discriminatory ground. The tests, eligibility and remedies differ." },
    ],
  }),

  "immigration-lawyers": C({
    intro: [
      "Immigration lawyers handle visas, citizenship and what happens when an application is refused or a visa is cancelled. It is federal law, and it changes more often than almost any other area of Australian practice.",
      "The work splits into two very different halves: getting an application right the first time, and fixing it after a refusal. The second is considerably harder and more expensive than the first.",
    ],
    whatTheyDo: [
      "Partner, family and parent visa applications",
      "Skilled and employer-sponsored visas, including labour agreements",
      "Student visas and applications to change course or provider",
      "Visa refusals and cancellations, including review at the tribunal",
      "Citizenship applications and refusals",
      "Character and health requirement issues, including waivers",
    ],
    whenToCall: [
      "Your application has been refused and there is a review deadline",
      "You have received a notice of intention to consider cancellation",
      "Your circumstances have changed while an application is pending",
      "There is anything in your history that might raise a character issue",
      "Your visa is expiring and you do not have a clear next step",
    ],
    costNote:
      "Immigration work is usually a fixed fee per application type, separate from the government's own visa application charge — which is often the larger amount and is not refunded if the application fails. Ask what is included if the department asks for more information, and what a tribunal review would cost on top.",
    chooseTips: [
      { title: "Check they are registered", body: "Immigration assistance may only be given by a registered migration agent or an Australian legal practitioner. Verify registration before you pay anything." },
      { title: "A lawyer matters most when something has gone wrong", body: "For a straightforward application a registered agent may be all you need. For refusals, cancellations, character issues or anything heading to a tribunal or court, use a lawyer." },
      { title: "Deadlines here are absolute", body: "Review periods in immigration are strict and generally cannot be extended. Diarise the date on the letter the day you receive it." },
    ],
    faqs: [
      { q: "What is the difference between a migration agent and an immigration lawyer?", a: "Both can be registered to give immigration assistance. A lawyer can also appear in court, advise on related legal issues and handle judicial review — which matters if your matter goes beyond the tribunal." },
      { q: "Can I appeal a visa refusal?", a: "Usually there is a right of review, but the period is short and strictly applied. The letter refusing your application sets out the deadline — act on it immediately." },
      { q: "Will a criminal record stop me getting a visa?", a: "Not necessarily, but it engages the character requirement and needs to be disclosed and handled carefully. Non-disclosure is treated far more seriously than the underlying matter." },
      { q: "How long do visa applications take?", a: "Processing times vary enormously by visa type and change regularly. The department publishes current estimates, and any firm quoting you a guaranteed timeframe is overpromising." },
    ],
  }),

  "traffic-lawyers": C({
    intro: [
      "Traffic lawyers deal with driving offences — drink and drug driving, excessive speed, driving while suspended, and the dangerous driving charges that sit at the serious end. It is state law, and both the penalties and the licence consequences differ significantly across the country.",
      "For most people the licence matters more than the fine. If you drive for work, or live somewhere without practical public transport, a disqualification is the real penalty and it is usually what a traffic lawyer is arguing about.",
    ],
    whatTheyDo: [
      "Drink and drug driving charges",
      "Applications for a work licence or restricted licence, where the state allows one",
      "Appeals against licence suspension",
      "Demerit point suspensions and good behaviour options",
      "Serious charges — dangerous, reckless or negligent driving",
      "Applications to have a matter dealt with without a conviction",
    ],
    whenToCall: [
      "You have been charged with drink or drug driving",
      "You have received a notice of suspension and rely on your licence",
      "You are facing a charge that carries a mandatory disqualification",
      "An accident caused injury and charges have been laid",
      "You have prior offences — the consequences escalate sharply",
    ],
    costNote:
      "Traffic matters are commonly fixed fee per appearance, which makes them one of the easier areas to get a firm quote for. Ask what happens if the matter is adjourned, and whether a licence appeal is priced separately from the charge itself.",
    chooseTips: [
      { title: "Say up front that you need your licence", body: "It shapes the entire strategy. A plea structured around keeping you on the road looks different from one aimed only at the fine." },
      { title: "Local knowledge matters", body: "Traffic lists are high volume and the approach of individual courts varies. Someone who appears there regularly knows what works." },
      { title: "Bring your driving history", body: "Prior offences change the range dramatically, and your lawyer needs the real picture from the first conversation." },
    ],
    faqs: [
      { q: "Can I keep my licence after a drink driving charge?", a: "Sometimes. Some states allow a work or restricted licence in defined circumstances, and in some cases a court can decline to record a conviction. It depends heavily on the reading, your history and the state — which is exactly what to ask a local lawyer." },
      { q: "Is it worth getting a lawyer for a low-range offence?", a: "If you rely on your licence, usually yes. The difference between the standard outcome and the best available one is often the difference between driving and not driving." },
      { q: "What happens if I just plead guilty by post?", a: "You lose the chance to put your circumstances to the court. For minor infringements that may be fine; for anything carrying a disqualification it rarely is." },
      { q: "Do interstate offences affect my licence at home?", a: "Generally yes. States share driving and demerit information, and a suspension incurred interstate can follow you back." },
    ],
  }),

  "commercial-lawyers": C({
    intro: [
      "Commercial lawyers advise businesses on how they are structured, what they sign and what happens when a deal goes wrong. The work ranges from a one-page services agreement through to the sale of the business itself.",
      "The pattern in this area is that the cheapest legal work is the earliest. Reviewing an agreement before signing costs a fraction of arguing about it afterwards.",
    ],
    whatTheyDo: [
      "Company structures, shareholder and partnership agreements",
      "Buying and selling businesses, including due diligence",
      "Supply, distribution, services and licensing agreements",
      "Commercial leases, for landlords and tenants",
      "Terms and conditions, privacy policies and consumer law compliance",
      "Commercial disputes, and the negotiation that usually precedes them",
    ],
    whenToCall: [
      "You are starting a business with someone else and nothing is documented",
      "You are buying or selling a business",
      "A contract has been put in front of you with a deadline attached",
      "You are signing a commercial lease",
      "A customer, supplier or co-owner is in dispute with you",
    ],
    costNote:
      "Commercial work is usually hourly, though standard documents are increasingly offered fixed fee. Transactions are often quoted as a range with a scope attached — read the scope closely, because that is what determines whether the range holds. For ongoing work, ask whether the firm offers a retainer.",
    chooseTips: [
      { title: "Right-size the firm", body: "A large commercial firm is the right answer for a complex acquisition and the wrong one for a services agreement. Both exist for a reason." },
      { title: "Ask about your industry", body: "Regulated industries carry rules a generalist may not know to look for. Say what your business does on the first call." },
      { title: "Documented beats agreed", body: "Most commercial disputes between people who trusted each other come down to something never written down." },
    ],
    faqs: [
      { q: "Do I really need a shareholders agreement?", a: "If you own a business with someone else, it is the document that decides what happens when one of you wants out, dies, or stops contributing. Without one, those questions get answered by default rules that may suit neither of you." },
      { q: "Can I use a template contract?", a: "For low-risk, repeatable arrangements, often yes. The risk is that templates are drafted for someone else's situation, and the clauses that matter — liability, termination, intellectual property — are the ones most likely to be wrong for yours." },
      { q: "What is due diligence?", a: "The investigation you do before buying a business — the financials, contracts, leases, staff entitlements and liabilities. It is where you find out whether you are buying what you were told you were buying." },
      { q: "How is a commercial lease different from a residential one?", a: "Commercial leases are far less regulated and far more negotiable. Terms about rent reviews, make-good obligations and options to renew are often where the real money sits." },
    ],
  }),

  "litigation-lawyers": C({
    intro: [
      "Litigation lawyers run disputes — recovering money owed, defending a claim, or arguing about a contract that has broken down. The work covers negotiation, mediation and court proceedings, in roughly that order of frequency.",
      "The first question a good litigator asks is not whether you would win, but whether the fight is worth having. Legal costs, time and the risk of paying the other side's costs often matter more to the decision than the merits do.",
    ],
    whatTheyDo: [
      "Contract and commercial disputes",
      "Debt recovery and enforcement of judgments",
      "Building and construction disputes",
      "Partnership, shareholder and business separation disputes",
      "Tribunal matters — consumer, tenancy, administrative review",
      "Mediation and negotiated settlement",
    ],
    whenToCall: [
      "You have been served with court or tribunal documents",
      "Someone owes you money and has stopped responding",
      "A contract has broken down and the other side is threatening action",
      "You have received a letter of demand",
      "A dispute is escalating and you want to know your realistic options",
    ],
    costNote:
      "Litigation is charged hourly and is the hardest area to estimate, because how much work it takes depends partly on the other side. Ask for a costs estimate broken down by stage, and ask specifically about adverse costs — in most courts the losing party contributes to the winner's costs, and that risk belongs in the decision from day one.",
    chooseTips: [
      { title: "Ask about settlement, not just victory", body: "The overwhelming majority of disputes settle. A lawyer focused only on trial is optimising for the least likely outcome." },
      { title: "Get the commercial picture early", body: "A good litigator will tell you when the cost of the fight exceeds what is at stake, and that advice is worth paying for." },
      { title: "Check the forum", body: "Small claims and tribunal matters are designed to run without lawyers and have their own cost rules. Make sure you are in the right forum before spending." },
    ],
    faqs: [
      { q: "If I win, does the other side pay my legal costs?", a: "Usually they contribute, but rarely all of it. Recovery of costs is partial in most courts, and it runs the other way if you lose — which is why the costs risk needs to be understood before you start." },
      { q: "How long does a court case take?", a: "Longer than most people expect. Matters that settle can resolve in months; contested proceedings that run to judgment often take a year or more depending on the court and complexity." },
      { q: "What is mediation?", a: "A structured negotiation with an independent mediator. It is often compulsory before a hearing, and a large share of disputes resolve there — usually far more cheaply than at trial." },
      { q: "Is a letter of demand worth sending?", a: "Frequently. It sets out the claim formally, creates a record, and resolves a good number of disputes without proceedings. It also needs to be accurate, because it can be put before a court later." },
    ],
  }),

  "property-lawyers": C({
    intro: [
      "Property lawyers handle the ownership and use of land beyond a straightforward sale — subdivisions, easements, development, co-ownership and the disputes that arise between neighbours, owners and developers.",
      "Where conveyancing is about completing a transaction, property law is about the rights attached to the land itself, and it is where the more complicated questions end up.",
    ],
    whatTheyDo: [
      "Subdivisions, development approvals and planning matters",
      "Easements, covenants and rights of way",
      "Boundary and fencing disputes",
      "Co-ownership disputes, including applications to force a sale",
      "Off-the-plan purchases and sunset clauses",
      "Adverse possession and title rectification",
    ],
    whenToCall: [
      "You are buying land with development potential",
      "A neighbour is disputing a boundary, fence or access",
      "You co-own a property with someone who wants out and you do not",
      "An easement or covenant is restricting what you can do",
      "Your off-the-plan purchase has hit a delay or a sunset clause",
    ],
    costNote:
      "Advice work is usually hourly; discrete tasks such as preparing an easement or a co-ownership agreement are often fixed fee. Where a matter becomes a dispute it is priced as litigation. Ask early which of the two you are in.",
    chooseTips: [
      { title: "Property law is state law", body: "Titles systems, planning regimes and dispute processes are all state-based. Use someone who practises where the land is." },
      { title: "Bring the title and plan", body: "Most property questions are answered by the title, the plan of subdivision and the planning overlay. Have them ready." },
      { title: "Neighbour disputes reward early advice", body: "They escalate quickly and are expensive to litigate relative to what is usually at stake." },
    ],
    faqs: [
      { q: "My neighbour's fence is on my land — what can I do?", a: "Start with the title and survey, since boundaries are frequently not where people assume. Most states have a dedicated fencing dispute process that is cheaper than court, and a property lawyer can point you to it." },
      { q: "Can I force the sale of a property I co-own?", a: "Often yes. Courts have power to appoint trustees for sale where co-owners cannot agree, though it is a last resort and the costs usually come out of the proceeds." },
      { q: "What is an easement?", a: "A right for someone else to use part of your land for a specific purpose — access, drainage, services. It attaches to the land and survives a change of owner, which is why searches matter before you buy." },
      { q: "What is a sunset clause in an off-the-plan contract?", a: "A date by which the development must be completed, after which either party may be able to end the contract. They have been the subject of significant law reform, and the rules differ by state." },
    ],
  }),

  "business-lawyers": C({
    intro: [
      "Business lawyers are the generalists of commercial practice — the firm a small or medium business calls for whatever has come up this week, from a contract to a difficult employee to a customer who will not pay.",
      "For most businesses this relationship is more valuable than any single piece of work. A lawyer who already knows how your business is structured gives faster and cheaper answers than one starting from scratch.",
    ],
    whatTheyDo: [
      "Business structures — sole trader, partnership, company, trust",
      "Everyday contracts: clients, suppliers, contractors, employees",
      "Buying or selling a small business",
      "Debt recovery and disputes with customers or suppliers",
      "Leases, licences and franchise agreements",
      "Compliance questions — privacy, consumer law, industry regulation",
    ],
    whenToCall: [
      "You are setting up and want the structure right from the start",
      "You are taking on staff or contractors for the first time",
      "A customer will not pay",
      "You are signing anything with a term longer than a year",
      "You are buying, selling or bringing in a partner",
    ],
    costNote:
      "Most small business work is hourly, with fixed fees common for standard documents. Many firms offer a fixed-fee starter package covering a structure, standard terms and an employment contract, which is usually better value than commissioning each piece separately.",
    chooseTips: [
      { title: "Look for a relationship, not a transaction", body: "The value compounds. A lawyer who knows your business answers the next question in ten minutes rather than an hour." },
      { title: "Ask about businesses your size", body: "Advice built for a listed company does not scale down well, and it is priced for someone else." },
      { title: "Get the structure right early", body: "Restructuring later has tax and duty consequences that setting it up correctly avoids entirely." },
    ],
    faqs: [
      { q: "Do I need a company or can I stay a sole trader?", a: "It depends on liability, tax and who you deal with. A company separates your personal assets from the business but costs more to run. It is a question worth an hour of combined legal and accounting advice." },
      { q: "Can I write my own terms and conditions?", a: "You can, and many do. The clauses that matter — liability limits, payment terms, termination, what happens to intellectual property — are the ones most often wrong or unenforceable in a self-drafted set." },
      { q: "What is the first legal thing a new business should do?", a: "Get the structure and ownership documented, especially if there is more than one owner. Almost every expensive small business dispute traces back to that not being done." },
      { q: "How do I recover unpaid invoices?", a: "Usually a letter of demand first, then a claim in the appropriate small claims or civil court. A lawyer can tell you quickly whether the amount justifies the process." },
    ],
  }),

  "divorce-lawyers": C({
    intro: [
      "Divorce is the formal legal end of a marriage. It is a discrete application, separate from the questions people usually care about more — the children and the property — which are dealt with independently and can be resolved before, during or after the divorce itself.",
      "Australia has no-fault divorce, so the court is not interested in who was at fault. The requirement is that the marriage has broken down irretrievably, demonstrated by a period of separation.",
    ],
    whatTheyDo: [
      "Preparing and filing the divorce application",
      "Sole applications, including serving the other party",
      "Applications where you have separated but lived under one roof",
      "Advising how the divorce interacts with property and parenting matters",
      "Consent orders to formalise a property settlement",
      "Advice on time limits that start running once a divorce is final",
    ],
    whenToCall: [
      "You have been separated for the required period and want to formalise it",
      "You cannot locate your spouse to serve the application",
      "You separated but continued living in the same house",
      "There is property to divide and you do not know the order to do things in",
      "You have been served with a divorce application",
    ],
    costNote:
      "The court charges its own filing fee, which is the larger cost for a simple divorce and may be reduced in cases of financial hardship. Legal fees for an uncontested divorce are usually a modest fixed amount. Property and parenting work is priced separately, because it is a separate job.",
    chooseTips: [
      { title: "Deal with property first, or at least early", body: "Finalising a divorce starts a time limit for property proceedings. Get advice on sequencing before you file." },
      { title: "Uncontested divorces rarely need much", body: "If you agree and there are no complications, this is straightforward. Spend the money on the property settlement instead." },
      { title: "Separation under one roof needs evidence", body: "It is accepted, but the court expects supporting material. A lawyer will tell you what is required." },
    ],
    faqs: [
      { q: "How long must we be separated?", a: "You must have been separated for at least twelve months before applying. It is possible to have separated while still living in the same home, though that requires additional evidence." },
      { q: "Do we both have to agree to the divorce?", a: "No. One party can apply. The other must be served, but their consent is not required — the ground is that the marriage has broken down irretrievably." },
      { q: "Does the divorce divide our property?", a: "No. Property settlement is a separate process. A divorce does, however, start a time limit for bringing property proceedings, so the two interact." },
      { q: "What if we have children under 18?", a: "The court needs to be satisfied that proper arrangements are in place for them before granting the divorce. It does not decide the parenting arrangements in that application — that is separate." },
    ],
  }),

  "compensation-lawyers": C({
    intro: [
      "Compensation lawyers pursue claims for people who have suffered a loss someone else is responsible for — injury at work, on the road, in public, or through negligent treatment or advice.",
      "The word covers several distinct statutory schemes, and which one applies is determined by how the loss occurred rather than by what you call it. The first job of a good compensation lawyer is telling you which scheme you are in.",
    ],
    whatTheyDo: [
      "Workers compensation claims and disputes",
      "Motor accident compensation",
      "Public liability claims",
      "Superannuation-based total and permanent disability claims",
      "Income protection and insurance disputes",
      "Appeals against impairment assessments and rejected claims",
    ],
    whenToCall: [
      "An insurer has rejected or terminated your claim",
      "You have been offered a settlement figure",
      "You have been injured and no one has explained your options",
      "Your claim has stalled and nobody is returning calls",
      "You have insurance through superannuation and are unable to work",
    ],
    costNote:
      "No win no fee is the norm. Ask how disbursements are handled if the claim does not succeed, and how any uplift is calculated. Some schemes regulate what a lawyer may charge, and a firm should be able to explain plainly which rules apply to your claim.",
    chooseTips: [
      { title: "Ask which scheme applies", body: "A firm that cannot answer that in the first conversation is not the right firm." },
      { title: "Check policies you forgot you had", body: "Superannuation frequently includes disability and income protection cover that people never claim on because they did not know it was there." },
      { title: "Do not accept the first offer without advice", body: "Early offers are made before the long-term impact is known, and settlements are usually final." },
    ],
    faqs: [
      { q: "How much is my claim worth?", a: "It depends on the scheme, the injury, its long-term effect on your capacity to work, and your circumstances. Any firm that gives you a number before seeing the medical evidence is guessing." },
      { q: "My employer says I can't claim — is that right?", a: "Employers do not decide entitlement; the scheme insurer does, and their decision can be reviewed. It is worth getting independent advice." },
      { q: "Can I claim through my super?", a: "Many superannuation policies include total and permanent disability cover, and it is claimable independently of any other compensation. It is one of the most commonly missed entitlements." },
      { q: "What if the accident was partly my fault?", a: "Compensation may be reduced to reflect your share, but partial fault does not usually eliminate a claim. Get advice before assuming you have none." },
    ],
  }),
};

/**
 * Areas without hand-written content still get a real page, built from the
 * category's own name and blurb. Thin, but honest and specific — better than an
 * empty section or spun filler.
 */
export function fallbackContent(name: string, singular: string, blurb: string | null): PracticeContent {
  const lower = singular.toLowerCase();
  return {
    intro: [
      blurb ?? `${name} across Australia.`,
      `This is a specialist area, and the firms listed below have nominated it as work they take on. If you are not certain it is the right category for your situation, a general practice solicitor can point you in the right direction — and there is no cost to asking.`,
    ],
    whatTheyDo: [
      `Advice on ${lower} matters and your available options`,
      "Preparing, reviewing and negotiating the relevant documents",
      "Correspondence and negotiation with the other side",
      "Representation at tribunal or court where a matter cannot be resolved",
    ],
    whenToCall: [
      "You have received a document with a deadline on it",
      "You have been asked to sign something you do not fully understand",
      "A dispute is escalating and informal attempts have not worked",
      "You want to know whether you have a case before spending money on it",
    ],
    costNote:
      "Most firms in this area charge hourly, with fixed fees available for defined pieces of work. Ask for a written costs agreement before work starts, and ask what would change the estimate.",
    chooseTips: [
      { title: "Ask how often they do this work", body: "Many firms list an area they only occasionally practise in. It is a fair question and a good firm will answer it honestly." },
      { title: "Get the first conversation right", body: "Bring your documents and a short timeline of what happened. It makes the advice sharper and the meeting cheaper." },
      { title: "Check they are current", body: "Verify the practitioner's registration with the law society in their state before engaging them." },
    ],
    faqs: [
      { q: `Do I need a specialist ${lower}?`, a: `For anything straightforward a general practice solicitor is often enough. Specialists earn their value where the matter is complex, contested, or the amount at stake is significant.` },
      { q: "What should I bring to the first appointment?", a: "Any documents you have been given, correspondence with the other side, and a short written timeline. Lawyers charge for time, and organised clients spend less of it." },
      { q: "How do I know if the fee is reasonable?", a: "Ask two or three firms for a written estimate on the same scope. Costs in this area are not standardised and the range can be wide." },
    ],
  };
}
