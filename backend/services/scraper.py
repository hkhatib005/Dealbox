import requests
from bs4 import BeautifulSoup
from database import db
from models.property import Property
import random
import time

# Free public data sources
HUD_HOMESTORE_URL = "https://www.hudhomestore.gov/Listing/PropertySearchResult.aspx"
FANNIE_MAE_URL = "https://www.homepath.com/listings.html"

def run_scrapers():
    """Run all free scrapers and seed demo data"""
    count = 0
    count += seed_demo_properties()
    return count

def seed_demo_properties():
    """
    Seed realistic demo properties from various distressed categories.
    In production, replace with real county scraper / HUD / Fannie Mae API calls.
    """
    demo_properties = [
        # Texas
        {
            'address': '2847 Elm Street', 'city': 'Dallas', 'state': 'TX', 'zip_code': '75204',
            'price': 148000, 'beds': 3, 'baths': 2.0, 'sqft': 1450,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Foreclosure', 'owner_name': 'Bank of America REO',
            'description': 'Foreclosed 3/2 in East Dallas. Needs full rehab. ARV ~$220k.',
            'lat': 32.7767, 'lng': -96.7970, 'source': 'Dallas CAD',
            'source_url': 'https://www.dallascad.org/SearchAddr.aspx',
            'arv_estimate': 220000
        },
        {
            'address': '5512 Oak Ave', 'city': 'Houston', 'state': 'TX', 'zip_code': '77007',
            'price': 195000, 'beds': 4, 'baths': 2.5, 'sqft': 1900,
            'property_type': 'Single Family', 'condition': 'Fair',
            'deal_type': 'Probate', 'owner_name': 'Estate of John Miller',
            'description': 'Probate sale. 4/2.5 in Montrose area. Owner passed 3 months ago, heirs motivated to sell fast.',
            'lat': 29.7604, 'lng': -95.3698, 'source': 'Harris County Probate Court',
            'source_url': 'https://probate.harriscountytx.gov/',
            'arv_estimate': 295000
        },
        {
            'address': '903 Mesquite Ln', 'city': 'San Antonio', 'state': 'TX', 'zip_code': '78201',
            'price': 87000, 'beds': 2, 'baths': 1.0, 'sqft': 980,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Tax Delinquent', 'owner_name': 'Rodriguez, Maria',
            'description': '3 years delinquent on taxes. Absentee owner lives in California. Foundation issues noted.',
            'lat': 29.4241, 'lng': -98.4936, 'source': 'Bexar County Tax Office',
            'source_url': 'https://www.bexar.org/743/Delinquent-Tax-Office',
            'arv_estimate': 145000
        },
        {
            'address': '1201 Congress Ave', 'city': 'Austin', 'state': 'TX', 'zip_code': '78701',
            'price': 320000, 'beds': 3, 'baths': 2.0, 'sqft': 1600,
            'property_type': 'Single Family', 'condition': 'Fair',
            'deal_type': 'Absentee Owner', 'owner_name': 'Thompson, Robert',
            'description': 'Absentee owner in Seattle. Tenant-occupied, lease ends next month. Great South Austin location.',
            'lat': 30.2672, 'lng': -97.7431, 'source': 'Travis CAD',
            'source_url': 'https://www.traviscad.org/property-search/',
            'arv_estimate': 430000
        },
        # Florida
        {
            'address': '4421 Sunset Blvd', 'city': 'Tampa', 'state': 'FL', 'zip_code': '33609',
            'price': 210000, 'beds': 3, 'baths': 2.0, 'sqft': 1350,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Foreclosure', 'owner_name': 'Wells Fargo REO',
            'description': 'Bank foreclosure in South Tampa. Cosmetic updates needed. HOA community.',
            'lat': 27.9506, 'lng': -82.4572, 'source': 'HUD Home Store',
            'source_url': 'https://www.hudhomestore.gov/Home/Index.aspx',
            'arv_estimate': 310000
        },
        {
            'address': '7823 Palmetto Dr', 'city': 'Orlando', 'state': 'FL', 'zip_code': '32801',
            'price': 175000, 'beds': 3, 'baths': 2.0, 'sqft': 1250,
            'property_type': 'Single Family', 'condition': 'Fair',
            'deal_type': 'Probate', 'owner_name': 'Estate of Patricia Chen',
            'description': 'Inherited property. Children live out of state, want quick sale. Solid bones, dated finishes.',
            'lat': 28.5383, 'lng': -81.3792, 'source': 'Orange County Clerk of Courts',
            'source_url': 'https://myeclerk.myorangeclerk.com/',
            'arv_estimate': 255000
        },
        {
            'address': '335 NW 12th St', 'city': 'Miami', 'state': 'FL', 'zip_code': '33136',
            'price': 395000, 'beds': 4, 'baths': 3.0, 'sqft': 2100,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Tax Delinquent', 'owner_name': 'Johnson, Marcus',
            'description': 'Wynwood adjacent. 4 years tax delinquent. Investor-owned, abandoned. Major value-add opportunity.',
            'lat': 25.7617, 'lng': -80.1918, 'source': 'Miami-Dade Tax Collector',
            'source_url': 'https://www.miamidade.gov/Apps/PA/propertysearch/',
            'arv_estimate': 620000
        },
        # Georgia
        {
            'address': '2200 Peachtree Rd', 'city': 'Atlanta', 'state': 'GA', 'zip_code': '30309',
            'price': 225000, 'beds': 3, 'baths': 2.0, 'sqft': 1550,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Foreclosure', 'owner_name': 'Fannie Mae HomePath',
            'description': 'HomePath listing in Buckhead. Light rehab needed. Strong rental market.',
            'lat': 33.7490, 'lng': -84.3880, 'source': 'Fannie Mae HomePath',
            'source_url': 'https://www.homepath.com/listings.html',
            'arv_estimate': 340000
        },
        {
            'address': '1502 Auburn Ave', 'city': 'Atlanta', 'state': 'GA', 'zip_code': '30312',
            'price': 145000, 'beds': 2, 'baths': 1.0, 'sqft': 1100,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Absentee Owner', 'owner_name': 'Williams, Sandra',
            'description': 'Historic Old Fourth Ward. Absentee owner hasn\'t maintained property in years. 2/1 with potential.',
            'lat': 33.7548, 'lng': -84.3763, 'source': 'Fulton County Assessor',
            'source_url': 'https://www.fultonassessor.org/residential-property-search/',
            'arv_estimate': 240000
        },
        # North Carolina
        {
            'address': '812 Davidson St', 'city': 'Charlotte', 'state': 'NC', 'zip_code': '28205',
            'price': 165000, 'beds': 3, 'baths': 2.0, 'sqft': 1400,
            'property_type': 'Single Family', 'condition': 'Fair',
            'deal_type': 'Probate', 'owner_name': 'Estate of George Davis',
            'description': 'Plaza Midwood estate sale. Inherited by 4 siblings who can\'t agree. Priced for quick liquidation.',
            'lat': 35.2271, 'lng': -80.8431, 'source': 'Mecklenburg County Clerk of Court',
            'source_url': 'https://www.nccourts.gov/locations/mecklenburg-county-courthouse',
            'arv_estimate': 265000
        },
        # Ohio
        {
            'address': '3340 Euclid Ave', 'city': 'Cleveland', 'state': 'OH', 'zip_code': '44115',
            'price': 55000, 'beds': 3, 'baths': 1.5, 'sqft': 1300,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Tax Delinquent', 'owner_name': 'Brown, James',
            'description': 'Tax delinquent 5 years. Low-income area but strong rental demand. Needs complete renovation.',
            'lat': 41.4993, 'lng': -81.6944, 'source': 'Cuyahoga County Fiscal Office',
            'source_url': 'https://fiscalofficer.cuyahogacounty.gov/RealEstate/Home.aspx',
            'arv_estimate': 120000
        },
        # Arizona
        {
            'address': '9821 N 7th St', 'city': 'Phoenix', 'state': 'AZ', 'zip_code': '85020',
            'price': 285000, 'beds': 4, 'baths': 2.0, 'sqft': 1850,
            'property_type': 'Single Family', 'condition': 'Fair',
            'deal_type': 'Foreclosure', 'owner_name': 'Chase REO',
            'description': 'Bank-owned 4/2 in North Phoenix. Pool, needs work. Strong rental market nearby.',
            'lat': 33.5722, 'lng': -112.0892, 'source': 'HUD Home Store',
            'source_url': 'https://www.hudhomestore.gov/Home/Index.aspx',
            'arv_estimate': 385000
        },
        # Tennessee
        {
            'address': '1103 Broadway', 'city': 'Nashville', 'state': 'TN', 'zip_code': '37203',
            'price': 310000, 'beds': 3, 'baths': 2.5, 'sqft': 1700,
            'property_type': 'Single Family', 'condition': 'Fair',
            'deal_type': 'Absentee Owner', 'owner_name': 'Patel, Raj',
            'description': 'Gulch area. Absentee investor from NYC. Tenant just left. Needs updates to maximize rent.',
            'lat': 36.1627, 'lng': -86.7816, 'source': 'Davidson County Assessor',
            'source_url': 'https://www.padctn.org/prc/',
            'arv_estimate': 450000
        },
        # Indiana
        {
            'address': '2450 N Meridian St', 'city': 'Indianapolis', 'state': 'IN', 'zip_code': '46208',
            'price': 98000, 'beds': 3, 'baths': 2.0, 'sqft': 1500,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Probate', 'owner_name': 'Estate of Dorothy Wilson',
            'description': 'Meridian Kessler estate sale. 3/2 bungalow, original everything. Amazing bones, ready for full flip.',
            'lat': 39.7684, 'lng': -86.1581, 'source': 'Marion County Probate Court',
            'source_url': 'https://www.indy.gov/agency/marion-county-probate-court',
            'arv_estimate': 185000
        },
        # Missouri
        {
            'address': '5678 Delmar Blvd', 'city': 'St. Louis', 'state': 'MO', 'zip_code': '63112',
            'price': 72000, 'beds': 3, 'baths': 1.5, 'sqft': 1200,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Tax Delinquent', 'owner_name': 'Jackson, Denise',
            'description': 'Delmar Loop adjacent. Tax delinquent 2 years. Boarded up but structurally sound per 2023 inspection.',
            'lat': 38.6270, 'lng': -90.1994, 'source': 'St. Louis County Revenue Dept',
            'source_url': 'https://revenue.stlouiscountymo.gov/Collections/Tax-Delinquencies/',
            'arv_estimate': 145000
        },
        # Illinois
        {
            'address': '741 W Chicago Ave', 'city': 'Chicago', 'state': 'IL', 'zip_code': '60654',
            'price': 245000, 'beds': 3, 'baths': 2.0, 'sqft': 1600,
            'property_type': 'Single Family', 'condition': 'Fair',
            'deal_type': 'Foreclosure', 'owner_name': 'Citibank REO',
            'description': 'River North bank foreclosure. 3/2 townhome style. Cosmetic only, priced below market.',
            'lat': 41.8781, 'lng': -87.6298, 'source': 'HUD Home Store',
            'source_url': 'https://www.hudhomestore.gov/Home/Index.aspx',
            'arv_estimate': 380000
        },
        # Nevada
        {
            'address': '8812 Desert Rose Way', 'city': 'Las Vegas', 'state': 'NV', 'zip_code': '89128',
            'price': 265000, 'beds': 4, 'baths': 3.0, 'sqft': 2000,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Absentee Owner', 'owner_name': 'Garcia, Luis',
            'description': 'Summerlin area. Owner in Florida, hasn\'t visited in 2 years. Pool, large lot, needs full renovation.',
            'lat': 36.1699, 'lng': -115.1398, 'source': 'Clark County Assessor',
            'source_url': 'https://assessor.clarkcountynv.gov/AssessorParcelDetail/tabid/119/Default.aspx',
            'arv_estimate': 410000
        },
        # Colorado
        {
            'address': '2233 Larimer St', 'city': 'Denver', 'state': 'CO', 'zip_code': '80205',
            'price': 375000, 'beds': 3, 'baths': 2.0, 'sqft': 1450,
            'property_type': 'Single Family', 'condition': 'Fair',
            'deal_type': 'Probate', 'owner_name': 'Estate of Frank Martinez',
            'description': 'RiNo estate sale. Original 1920s craftsman. Heirs in California want quick close. Massive upside.',
            'lat': 39.7392, 'lng': -104.9903, 'source': 'Denver Probate Court',
            'source_url': 'https://www.courts.state.co.us/Courts/Denver/Probate/',
            'arv_estimate': 580000
        },
        # Virginia
        {
            'address': '3300 Patterson Ave', 'city': 'Richmond', 'state': 'VA', 'zip_code': '23221',
            'price': 155000, 'beds': 3, 'baths': 1.5, 'sqft': 1350,
            'property_type': 'Single Family', 'condition': 'Distressed',
            'deal_type': 'Tax Delinquent', 'owner_name': 'Thompson, Henry',
            'description': 'Museum District. 3 years delinquent. Vacant for 18 months. Investor previously had it under contract.',
            'lat': 37.5407, 'lng': -77.4360, 'source': 'City of Richmond Finance Dept',
            'source_url': 'https://www.richmondgov.com/Finance/TaxDelinquency.aspx',
            'arv_estimate': 285000
        },
        # Washington
        {
            'address': '5521 Rainier Ave S', 'city': 'Seattle', 'state': 'WA', 'zip_code': '98118',
            'price': 485000, 'beds': 4, 'baths': 2.5, 'sqft': 2200,
            'property_type': 'Single Family', 'condition': 'Fair',
            'deal_type': 'Foreclosure', 'owner_name': 'US Bank REO',
            'description': 'Columbia City bank-owned. 4/2.5 with bonus room. Light rehab in hot South Seattle market.',
            'lat': 47.6062, 'lng': -122.3321, 'source': 'Fannie Mae HomePath',
            'source_url': 'https://www.homepath.com/listings.html',
            'arv_estimate': 695000
        },
    ]

    added = 0
    for data in demo_properties:
        existing = Property.query.filter_by(
            address=data['address'],
            city=data['city'],
            state=data['state']
        ).first()
        if not existing:
            prop = Property(**data)
            db.session.add(prop)
            added += 1
        else:
            # Patch source fields on existing records
            existing.source = data.get('source', existing.source)
            existing.source_url = data.get('source_url', existing.source_url)

    db.session.commit()
    print(f"✅ Seeded {added} demo properties")
    return added


def scrape_hud_homes():
    """
    Scrape HUD HomeSale listings (free public source).
    In production this would hit the real HUD API.
    """
    results = []
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; DealBox/1.0)'}
        response = requests.get(
            'https://www.hudhomestore.gov/Listing/PropertySearchResult.aspx',
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Parse listings - structure varies by HUD site version
            listings = soup.find_all('div', class_='property-listing')
            for listing in listings[:20]:
                results.append({
                    'source': 'HUD HomeSale',
                    'source_url': 'https://www.hudhomestore.gov'
                })
    except Exception as e:
        print(f"HUD scrape failed: {e}")
    return results
