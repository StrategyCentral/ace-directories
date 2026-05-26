import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://vpumgmasnggconvgujho.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

ALD_TENANT_ID = None  # Set after first Supabase query in bulk_loader.py

SCRAPE_RATE_LIMIT_SECONDS = (1.5, 3.0)  # min, max random delay between requests
REQUEST_TIMEOUT = 10
MAX_RETRIES = 3

USER_AGENT = (
    "AussieLawyerDirectory/1.0 "
    "(directory listing verification; contact@aussielawyerdirectory.com.au)"
)

# Practice area inference rules — checked against listing name
PRACTICE_AREA_INFERENCE = {
    "family": "family-law",
    "divorce": "family-law",
    "custody": "family-law",
    "matrimonial": "family-law",
    "criminal": "criminal-law",
    "crime": "criminal-law",
    "defence": "criminal-law",
    "traffic": "traffic-law",
    "drink driving": "traffic-law",
    "dui": "traffic-law",
    "property": "property-law",
    "conveyancing": "property-law",
    "conveyancer": "property-law",
    "real estate": "property-law",
    "wills": "wills-estates",
    "estate": "wills-estates",
    "probate": "wills-estates",
    "employment": "employment-law",
    "workplace": "employment-law",
    "workers comp": "personal-injury",
    "compensation": "personal-injury",
    "injury": "personal-injury",
    "immigration": "immigration-law",
    "migration": "immigration-law",
    "visa": "immigration-law",
    "commercial": "commercial-law",
    "business": "commercial-law",
    "corporate": "commercial-law",
    "intellectual property": "intellectual-property",
    "patent": "intellectual-property",
    "trademark": "intellectual-property",
    "copyright": "intellectual-property",
    "tax": "tax-law",
    "debt": "debt-insolvency",
    "insolvency": "debt-insolvency",
    "bankruptcy": "debt-insolvency",
    "elder": "elder-law",
    "aged care": "elder-law",
    "guardianship": "elder-law",
    "defamation": "media-defamation",
    "media": "media-defamation",
    "environmental": "environmental-law",
    "planning": "environmental-law",
    "administrative": "administrative-law",
}

# Entity type classification
FIRM_SIGNALS = [
    "Lawyers", "Law", "Legal", "Solicitors", "Barristers",
    "Partners", "Associates", "Group", "Chambers", "Pty",
    "Ltd", "Inc", "& Co", "and Co", "Services", "Firm",
    "Practice", "Counsel", "Attorneys", "Justice"
]
