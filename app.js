(() => {
  'use strict';
  const C = window.EZYGO_CONFIG;
  const PHONE = '919656309061';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const apiHeaders = { apikey: C.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${C.SUPABASE_PUBLISHABLE_KEY}` };
  let cards = [], groups = [], packages = [], galleries = [];
  let currentCard = null, currentTour = null, currentGallery = null, currentImageIndex = 0;
  let currentTourImageIndex = 0, currentTourImages = [];
  let currentVisaImageIndex = 0, currentVisaImages = [];
  let currentView = 'explorePane';
  let isLoadingCards = true;
  let activeType = '', activeDays = '';
  const preloadedMedia = new Set();
  let mediaObserver = null;
  const CURATED_PACKAGES = Object.freeze([
    {
      "id": "delhi-agra-jaipur-4n5d-nov2026",
      "title": "Delhi - Agra - Jaipur",
      "tag": "04N/05D Group Tour",
      "destination": "Delhi · Agra · Jaipur",
      "duration": "4 Nights · 5 Days",
      "price": "₹7,200 / person",
      "summary": "November 2026 group tour for 40 + 04 adults (44 total), with breakfast and dinner, 3-star hotel stays and a 45-seater AC coach across Delhi, Agra and Jaipur.",
      "highlights": [
        "India Gate",
        "Red Fort",
        "Qutub Minar",
        "Taj Mahal",
        "Agra Fort",
        "Fatehpur Sikri",
        "Amber Fort",
        "City Palace",
        "Hawa Mahal",
        "Jal Mahal"
      ],
      "facts": [
        {
          "label": "Travel date",
          "value": "Nov 2026"
        },
        {
          "label": "Guests",
          "value": "44 Adults"
        },
        {
          "label": "Rooms",
          "value": "10 Quad Sharing"
        },
        {
          "label": "Meal plan",
          "value": "Breakfast & Dinner"
        },
        {
          "label": "Transport",
          "value": "45-Seater AC Coach"
        },
        {
          "label": "Hotel category",
          "value": "03 Star"
        }
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Delhi arrival & sightseeing",
          "meal": "Dinner",
          "text": "Early morning arrival at Delhi Airport and pickup. Visit India Gate, President House and Parliament House (outside view), Red Fort, Raj Ghat and Qutub Minar. Proceed to the hotel, check in and stay overnight in Delhi."
        },
        {
          "day": 2,
          "title": "Delhi - Agra",
          "meal": "Breakfast · Dinner",
          "text": "After breakfast, check out from the hotel and drive to Agra by Yamuna Expressway (approximately 5 hours). On arrival, check in at the hotel and stay overnight in Agra."
        },
        {
          "day": 3,
          "title": "Agra - Jaipur",
          "meal": "Breakfast · Dinner",
          "text": "After breakfast, check out and visit the Taj Mahal, the ivory-white marble mausoleum commissioned in 1632 by Mughal emperor Shah Jahan for Mumtaz, followed by Agra Fort, the historic Mughal fort and former imperial residence. Continue to Jaipur and visit Fatehpur Sikri on the way. On arrival in Jaipur, check in and stay overnight."
        },
        {
          "day": 4,
          "title": "Jaipur sightseeing",
          "meal": "Breakfast · Dinner",
          "text": "After breakfast, visit City Palace, Jantar Mantar, Amber Fort, Jaigarh Fort, Nahargarh Fort, Albert Hall Museum, Hawa Mahal and Jal Mahal. Return to the hotel and stay overnight in Jaipur."
        },
        {
          "day": 5,
          "title": "Jaipur - Delhi drop",
          "meal": "Breakfast",
          "text": "After breakfast, check out from the hotel and proceed to Delhi. On arrival, drop at Delhi Airport or Railway Station as per the travel time."
        }
      ],
      "inclusions": [
        "02 rooms double sharing (as listed in the supplied inclusions)",
        "Breakfast and dinner at hotel",
        "All transport and sightseeing by personal vehicle"
      ],
      "exclusions": [
        "Air fare / train fare",
        "Entrance or monument fees",
        "Horse, camel or elephant safari and Amer Fort jeep charges",
        "Meals other than those specified in package inclusions",
        "Personal expenses such as tips, telephone calls, laundry, liquor and room-heater charges on hill stations",
        "Any item not specified in package inclusions",
        "GST 5% on billing"
      ],
      "sections": [
        {
          "title": "Hotels used",
          "items": [
            "Delhi: Hotel Apra Deluxe / similar - 01 night",
            "Agra: Hotel The Taj Vilas / similar - 01 night",
            "Jaipur: Hotel Lords Plaza / Hotel Vesta Maurya Palace / similar - 02 nights"
          ]
        },
        {
          "title": "Tour setup",
          "items": [
            "No. of pax: 40 + 04 adults",
            "Room plan in tour details: 10 rooms quad sharing (01 king bed + 01 extra bed/mattress)",
            "Meal plan: MAPAI - breakfast and dinner",
            "Transport: 45-seater AC coach",
            "Package cost: INR 7,200 per person × 44 adults"
          ]
        }
      ],
      "terms": [
        "Child below 5 years is complimentary; above 5 years is chargeable.",
        "Hotel names are subject to availability at the time of confirmation.",
        "40% advance payment is required at the time of booking; balance payment should be cleared before 7 days of arrival.",
        "Cancellation before 15 days of arrival: no charge. Cancellation 10-14 days before arrival: 25% chargeable. Cancellation 5-10 days before arrival: 50% chargeable. Cancellation within 5 days of arrival or no-show: 100% chargeable.",
        "Refunds are stated to be processed within 15 working days.",
        "Guests must carry valid photo ID at check-in. Foreign guests must carry a valid passport and visa. Baggage security checks may be carried out before check-in.",
        "The quotation itself is not booking confirmation. Prices and services can change at confirmation, and rooms remain subject to availability until written confirmation.",
        "The operator states it is not responsible for unexpected situations such as strikes, road jams, train delays, political disturbances, landslides, road blockages or other natural calamities; extra stay or related charges may be payable by the client.",
        "Room information in the supplied quotation is inconsistent: the tour details state 10 quad-sharing rooms, while the inclusion list also states 02 rooms double sharing. Final room allocation should be reconfirmed before booking."
      ],
      "cover_path": "local:/assets/packages/delhi-agra-jaipur-4n5d/cover.jpg",
      "image_paths": [],
      "active": true
    },
    {
      "id": "hyderabad-student-3d",
      "title": "Hyderabad Student Package",
      "tag": "Student Tour",
      "destination": "Hyderabad · Ramoji Film City",
      "duration": "3 Days",
      "price": "Ask for price",
      "summary": "A student-focused Hyderabad itinerary covering the city’s major heritage attractions, Ramoji Film City, local sightseeing, meals, transport and tour coordination.",
      "highlights": [
        "Birla Mandir",
        "Mecca Masjid",
        "Ramoji Film City",
        "Salar Jung Museum",
        "Golconda Fort",
        "Charminar",
        "Lumbini Park",
        "Nehru Zoological Park"
      ],
      "facts": [
        {
          "label": "Meals",
          "value": "2 Breakfasts · 2 Lunches · 2 Dinners"
        },
        {
          "label": "Transport",
          "value": "A/C Transport"
        },
        {
          "label": "Stay",
          "value": "Sharing Basis"
        },
        {
          "label": "Support",
          "value": "Tour Coordinator"
        }
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Arrival & sightseeing",
          "meal": "Lunch · Dinner",
          "text": "Morning arrival at Hyderabad, receive and transfer to the hotel. After freshening up, proceed to Salar Jung Museum, Charminar and Mecca Masjid (drive through). In the evening visit Birla Mandir, Lumbini Park, Necklace Road, NTR Gardens, New Secretariat Building and the Dr. B. R. Ambedkar 125 ft statue. Night stay at the hotel."
        },
        {
          "day": 2,
          "title": "Ramoji Film City tour",
          "meal": "Breakfast · Lunch · Dinner",
          "text": "Visit Ramoji Film City from 9 AM to 8 PM. Return for an overnight stay in Hyderabad."
        },
        {
          "day": 3,
          "title": "Sightseeing, shopping & departure",
          "meal": "Breakfast",
          "text": "Morning check-out. Proceed to Nehru Zoological Park, Salar Jung Museum and Golconda Fort, followed by shopping and a night drop at the railway station."
        }
      ],
      "inclusions": [
        "A/C transport",
        "Toll taxes, parking charges and driver allowance",
        "Meal plan AP all buffet: 2 breakfasts, 2 lunches and 2 dinners",
        "Sightseeing as per the itinerary",
        "Accommodation on sharing basis",
        "Entry ticket charges as per the itinerary",
        "Tour coordinator"
      ],
      "exclusions": [
        "Extra costs arising due to natural calamities, landslides, road blockage, political disturbances, etc.",
        "Personal expenses such as laundry, telephone, tips and gratuity",
        "Soft / hard drinks",
        "Anything not mentioned in the inclusions",
        "Extra kilometres used for personal purposes are chargeable"
      ],
      "sections": [
        {
          "title": "Operational notes",
          "items": [
            "Salar Jung Museum and Chowmahalla Palace are closed on Friday.",
            "Nehru Zoological Park is closed on Monday.",
            "Carry ID cards, follow group instructions and keep the surroundings clean."
          ]
        },
        {
          "title": "Booking & cancellation terms from the supplied package",
          "items": [
            "50% of total cost on booking; full payment 15 days before departure.",
            "More than 15 days before departure: 50% of tour cost cancellation charge.",
            "Less than 15 days and up to 7 days before departure: 75% of tour cost cancellation charge.",
            "Less than 7 days before departure: 100% of tour cost cancellation charge.",
            "Airfare is stated as non-refundable."
          ]
        }
      ],
      "terms": [
        "The supplied package does not state a tour price; current pricing should be confirmed with EzyGo Travel.",
        "Sightseeing and operating schedules may need adjustment based on attraction closure days and local conditions."
      ],
      "cover_path": "local:/assets/packages/hyderabad-student-3d/cover.jpg",
      "image_paths": [
        "local:/assets/packages/hyderabad-student-3d/day-2.jpg",
        "local:/assets/packages/hyderabad-student-3d/day-3.jpg"
      ],
      "active": true
    },
    {
      "id": "manali-delhi-5d4n",
      "title": "Manali - Delhi to Delhi",
      "tag": "5 Days / 4 Nights",
      "destination": "Delhi · Manali · Solang · Sissu · Kullu",
      "duration": "5 Days · 4 Nights",
      "price": "Enquire for current rate",
      "summary": "A Delhi-to-Delhi Manali package with Volvo AC semi-sleeper travel, Manali local sightseeing, Solang Valley, Sissu, Atal Tunnel, Kullu and Naggar, with selected adventure activities available at extra cost.",
      "highlights": [
        "Hadimba Temple",
        "Vashisht Temple",
        "Van Vihar",
        "Jogini Waterfall Trek",
        "Mall Road",
        "Solang Valley",
        "Sissu",
        "Atal Tunnel",
        "Kullu",
        "Naggar Castle"
      ],
      "facts": [
        {
          "label": "Hotel stay",
          "value": "2 Nights"
        },
        {
          "label": "Meals",
          "value": "2 Breakfasts · 2 Dinners"
        },
        {
          "label": "Travel",
          "value": "Volvo + Private Sightseeing"
        },
        {
          "label": "Boarding",
          "value": "Kashmere Gate, Delhi"
        }
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Board bus to Manali",
          "meal": "—",
          "text": "Board the Volvo AC semi-sleeper bus to Manali from Kashmere Gate, Delhi, in the evening / night."
        },
        {
          "day": 2,
          "title": "Manali local sightseeing",
          "meal": "Dinner",
          "text": "Reach Manali, check in at the hotel and proceed for Manali sightseeing. Visit Hadimba Temple, Vashisht Temple, Van Vihar, Jogini Waterfall trek, Mall Road and Buddhist Monastery. Dinner and overnight stay."
        },
        {
          "day": 3,
          "title": "Manali - Solang, Sissu & Atal Tunnel",
          "meal": "Breakfast · Dinner",
          "text": "After breakfast, proceed for sightseeing covering Solang Valley, Sissu and Atal Tunnel. Rohtang Pass may be visited if open and carries additional charges. Return for dinner and overnight stay."
        },
        {
          "day": 4,
          "title": "Kullu & return Volvo",
          "meal": "Breakfast",
          "text": "After breakfast, check out and proceed to Naggar (Kullu), Kullu and Naggar Castle. Adventure activities are available; rafting and paragliding are at additional cost. Board the Volvo bus to Delhi in the evening / night."
        },
        {
          "day": 5,
          "title": "Reach Delhi",
          "meal": "—",
          "text": "Reach Delhi in the morning."
        }
      ],
      "inclusions": [
        "Accommodation - 2 nights",
        "2 breakfasts",
        "2 dinners",
        "Private transportation for Manali sightseeing",
        "Volvo bus tickets (Delhi - Manali)",
        "Dedicated support team"
      ],
      "exclusions": [
        "Meals not mentioned",
        "Adventure activities",
        "Snow coat (available for rent)",
        "Personal expenses",
        "Any other expense not mentioned in the inclusions",
        "Rohtang Pass charges when applicable",
        "Rafting and paragliding charges"
      ],
      "sections": [
        {
          "title": "Standard package rates - supplied brochure",
          "items": [
            "2 persons · Sedan · 2-star / 3-star basic rooms · ₹7,500 per person",
            "4 persons · Sedan · 2-star / 3-star basic rooms · ₹5,600 per person",
            "4 persons · Sumo · 2-star / 3-star basic rooms · ₹6,000 per person",
            "6 persons · Sumo · 2-star / 3-star basic rooms · ₹5,500 per person",
            "8 persons · Sumo · 2-star / 3-star basic rooms · ₹5,200 per person",
            "10 persons · Tempo · 2-star / 3-star basic rooms + campfire · ₹5,300 per person"
          ]
        },
        {
          "title": "Premium package rates - supplied brochure",
          "items": [
            "2 persons · Sedan · 3-star rooms · ₹8,000 per person",
            "4 persons · Sedan · 3-star rooms · ₹6,300 per person",
            "4 persons · Ertiga / Innova · 3-star rooms · ₹7,000 per person",
            "6 persons · Ertiga / Innova · 3-star rooms · ₹6,300 per person",
            "8 persons · Tempo · 3-star rooms · ₹6,200 per person",
            "10 persons · Tempo · 3-star rooms + campfire · ₹5,900 per person"
          ]
        },
        {
          "title": "Luxury package rates - supplied brochure",
          "items": [
            "2 persons · Sedan · 4-star rooms · ₹10,500 per person",
            "4 persons · Sedan · 4-star rooms · ₹8,700 per person",
            "4 persons · Ertiga / Innova · 4-star rooms · ₹9,500 per person",
            "6 persons · Ertiga / Innova · 4-star rooms · ₹8,500 per person",
            "8 persons · Tempo · 4-star rooms · ₹8,400 per person",
            "10 persons · Tempo · 4-star rooms + campfire · ₹8,200 per person"
          ]
        }
      ],
      "terms": [
        "The brochure rates were valid only until 15 December 2025 and may change on long weekends. Those rates are no longer current, so EzyGo Travel should confirm the latest price before booking.",
        "Child under 5 years: no extra charge; bus ticket rate applies if an extra bus seat is required.",
        "Additional charges apply for visiting Rohtang Pass, and the pass is stated to be closed in winter / subject to opening conditions."
      ],
      "cover_path": "local:/assets/packages/manali-delhi-5d4n/cover.jpg",
      "image_paths": [
        "local:/assets/packages/manali-delhi-5d4n/manali.jpg",
        "local:/assets/packages/manali-delhi-5d4n/kullu.jpg"
      ],
      "active": true
    },
    {
      "id": "kashmir-srinagar-5d4n",
      "title": "Kashmir - Srinagar to Srinagar",
      "tag": "5 Days / 4 Nights",
      "destination": "Srinagar · Sonamarg · Gulmarg · Pahalgam",
      "duration": "5 Days · 4 Nights",
      "price": "Ask for price",
      "summary": "A Srinagar-to-Srinagar Kashmir tour with four nights of accommodation, private transport, breakfast and dinner, a Shikara ride and day excursions to Sonamarg, Gulmarg and Pahalgam.",
      "highlights": [
        "Mughal Gardens",
        "Shikara Ride",
        "Sonamarg",
        "Thajiwas Glacier",
        "Gulmarg",
        "Gondola Ride",
        "Pahalgam",
        "Aru Valley",
        "Betaab Valley",
        "Chandanwari"
      ],
      "facts": [
        {
          "label": "Accommodation",
          "value": "4 Nights"
        },
        {
          "label": "Meals",
          "value": "4 Breakfasts · 4 Dinners"
        },
        {
          "label": "Transport",
          "value": "Private Transportation"
        },
        {
          "label": "Included",
          "value": "Shikara Ride"
        }
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Srinagar arrival & local sightseeing",
          "meal": "Dinner",
          "text": "Airport pickup, hotel check-in and Srinagar sightseeing. Visit the Mughal Gardens - Cheshmashahi, Nishat Garden and Shalimar Garden - along with Dargah Hazratbal, Pari Mahal and a Shikara ride. Sightseeing depends on arrival time; remaining local sightseeing can be completed on the last day."
        },
        {
          "day": 2,
          "title": "Sonamarg - Meadow of Gold",
          "meal": "Breakfast · Dinner",
          "text": "Full-day excursion to Sonamarg. Thajiwas Glacier can be visited by trek / pony ride. Zojila Pass / Zero Point requires a local Union cab. Return after the excursion for dinner."
        },
        {
          "day": 3,
          "title": "Gulmarg - Meadow of Flowers",
          "meal": "Breakfast · Dinner",
          "text": "Full-day excursion to Gulmarg. Gondola ride and winter snow activities are available at additional charges. Return after sightseeing for dinner."
        },
        {
          "day": 4,
          "title": "Pahalgam - Valley of Shepherds",
          "meal": "Breakfast · Dinner",
          "text": "Full-day excursion to Pahalgam. Aru Valley, Betaab Valley and Chandanwari are covered by local Union taxi. Baisaran Valley (Mini Switzerland of India) and Tulian Lake can be explored by pony ride / trek."
        },
        {
          "day": 5,
          "title": "Srinagar departure",
          "meal": "Breakfast",
          "text": "Breakfast, hotel check-out, remaining Srinagar local sightseeing if any, followed by Airport / Railway drop."
        }
      ],
      "inclusions": [
        "Accommodation - 4 nights",
        "Private transportation",
        "4 breakfasts",
        "4 dinners",
        "Shikara ride",
        "Dedicated support team"
      ],
      "exclusions": [
        "Meals not mentioned",
        "Adventure activities",
        "Union cabs and pony rides",
        "Personal expenses",
        "Snow coat / boot",
        "Any other expense not mentioned in the inclusions"
      ],
      "sections": [
        {
          "title": "Sonamarg local travel notes",
          "items": [
            "A separate local Union taxi is required in Sonamarg for Zero Point; outside commercial taxis are not permitted for local sightseeing.",
            "The supplied guide states some drivers may initially quote ₹6,000-₹8,000 per taxi and lists a government-approved return rate of ₹4,000 with a 2-3 hour halt. Reconfirm current local rates before travel.",
            "Thajiwas Glacier is stated to be around 4 km from Sonamarg."
          ]
        },
        {
          "title": "Gulmarg activity notes",
          "items": [
            "Gondola ride and winter snow activities are additional-charge activities.",
            "The supplied guide lists Gondola cable-car rates of ₹810 for Phase 1 and ₹1,010 for Phase 2. Reconfirm current ticket prices before booking."
          ]
        },
        {
          "title": "Pahalgam local travel notes",
          "items": [
            "Pahalgam Union Taxi operators are stated as the authorized providers for sightseeing to Aru Valley, Betaab Valley and Chandanwari.",
            "The supplied guide lists an approximate Union Taxi rate of ₹2,500 for these sightseeing points depending on cab type. Reconfirm current local rates before travel."
          ]
        },
        {
          "title": "Staying connected in Kashmir",
          "items": [
            "The supplied guide states that postpaid SIMs or prepaid SIM cards from Jammu & Kashmir are functional in the region, while prepaid SIMs from other states will not work.",
            "It suggests converting an existing SIM to postpaid or purchasing a prepaid SIM in Jammu & Kashmir; hotel Wi-Fi is also stated as available."
          ]
        }
      ],
      "terms": [
        "Srinagar local sightseeing that cannot be completed on arrival day can be moved to the last day.",
        "Local Union taxi, pony, Gondola and activity pricing is operational information from the supplied package and should be reconfirmed for the actual travel date."
      ],
      "cover_path": "local:/assets/packages/kashmir-5d4n/cover.jpg",
      "image_paths": [
        "local:/assets/packages/kashmir-5d4n/sonamarg.jpg",
        "local:/assets/packages/kashmir-5d4n/gulmarg.jpg"
      ],
      "active": true
    }
  ]);

  function esc(v='') { return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function packageKey(p={}){ return String(p.title||'').trim().toLowerCase().replace(/\s+/g,' '); }
  function mergeCuratedPackages(remote=[]){
    const out=[...(Array.isArray(remote)?remote:[])];
    const ids=new Set(out.map(p=>String(p.id||'')));
    const titles=new Set(out.map(packageKey).filter(Boolean));
    for(const item of CURATED_PACKAGES){
      const key=packageKey(item);
      if(ids.has(String(item.id)) || (key && titles.has(key))) continue;
      out.push(item); ids.add(String(item.id)); if(key) titles.add(key);
    }
    return out;
  }
  function galleryHasImages(g={}){
    if(String(g.cover_path||'').trim()) return true;
    return (Array.isArray(g.image_paths)?g.image_paths:[]).some(x=>String(x||'').trim());
  }
  function visibleGalleries(){ return galleries.filter(galleryHasImages); }
  function cleanGroupName(v=''){ return String(v).replace(/^[\s🌏🌍]+/u,'').trim(); }
  function svgPlaceholder(label='Travel') {
    const txt = esc(label).slice(0,28);
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef1f4"/><stop offset="1" stop-color="#dfe4e9"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="450" cy="470" r="88" fill="#fff" opacity=".8"/><path d="M382 470h136M450 402v136" stroke="#b5bdc6" stroke-width="14" stroke-linecap="round"/><text x="450" y="650" text-anchor="middle" font-family="Arial" font-size="34" fill="#7f8994">${txt}</text></svg>`)} `;
  }
  function mediaUrl(path, label='Travel') {
    const raw=String(path||'').trim();
    if (!raw) return svgPlaceholder(label).trim();
    if (/^data:image\//i.test(raw)) return raw;

    // Initial prebuilt images live inside the deployed /assets folder.
    if (raw.startsWith('local:')) return raw.slice(6);
    if (raw.startsWith('/assets/')) return raw;

    // Future images uploaded from Admin are stored in Supabase Storage.
    if (/^https?:\/\//i.test(raw)) {
      if (raw.startsWith(C.SUPABASE_URL)) return raw;
      return svgPlaceholder(label).trim();
    }

    const clean=raw
      .replace(/^site-media\//,'')
      .replace(/^storage\/v1\/object\/public\/site-media\//,'')
      .replace(/^\/+/, '');

    return `${C.SUPABASE_URL}/storage/v1/object/public/${C.STORAGE_BUCKET}/${clean}`;
  }
  function imageFallback(img,label='Travel'){ img.onerror=null; img.src=svgPlaceholder(label).trim(); }
  function conciseAvailability(value=''){
    const t=String(value||'').trim();
    if(!t) return 'Check now';
    if(t.length<=22) return t;
    if(/available\s*now/i.test(t)) return 'Available now';
    if(/available/i.test(t) && t.length<=30) return 'Available';
    if(/contact|confirm|processing|current/i.test(t)) return 'Check now';
    return 'Check now';
  }
  function loadingCards(count=8){
    return Array.from({length:count},()=>`
      <article class="skeletonCard" aria-hidden="true">
        <div class="skeletonPoster skeletonGlow"></div>
        <div class="skeletonLine skeletonGlow"></div>
        <div class="skeletonLine short skeletonGlow"></div>
      </article>`).join('');
  }
  function showCardLoading(){
    const grid=$('#cardGrid');
    if(grid) grid.innerHTML=loadingCards(window.innerWidth>=900?10:6);
  }
  function packageLoadingCards(count=3){
    return Array.from({length:count},()=>`<article class="tourSkeleton" aria-hidden="true"><div class="tourSkeletonMedia skeletonGlow"></div><div class="tourSkeletonBody"><div class="skeletonLine skeletonGlow"></div><div class="skeletonLine short skeletonGlow"></div></div></article>`).join('');
  }
  function galleryLoadingCards(count=6){
    return Array.from({length:count},()=>`<div class="gallerySkeleton" aria-hidden="true"><div class="gallerySkeletonMedia skeletonGlow"></div><div class="skeletonLine short skeletonGlow"></div></div>`).join('');
  }
  function showPackageLoading(){const grid=$('#packageGrid2');if(grid)grid.innerHTML=packageLoadingCards(window.innerWidth>=900?3:2)}
  function showGalleryLoading(){const grid=$('#galleryGrid');if(grid)grid.innerHTML=galleryLoadingCards(window.innerWidth>=900?6:4)}
  function preloadMedia(paths,priority='low'){
    for(const path of paths||[]){
      const url=mediaUrl(path);
      if(!url||url.startsWith('data:')||preloadedMedia.has(url))continue;
      preloadedMedia.add(url);
      const img=new Image();
      img.decoding='async';
      try{img.fetchPriority=priority}catch(_){}
      img.src=url;
    }
  }
  function observeMediaAhead(){
    if(mediaObserver)mediaObserver.disconnect();
    if(!('IntersectionObserver' in window))return;
    mediaObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const el=entry.target;if(el.dataset.id){const card=cards.find(x=>String(x.id)===String(el.dataset.id));if(card)preloadMedia([card.cover_path,...arr(card.detail_paths).slice(0,2)],'low')}else if(el.dataset.tour){const tour=packages.find(x=>String(x.id)===String(el.dataset.tour));if(tour)preloadMedia([tour.cover_path,...arr(tour.image_paths).slice(0,2)],'low')}else if(el.dataset.gallery){const gallery=galleries.find(x=>String(x.id)===String(el.dataset.gallery));if(gallery)preloadMedia([gallery.cover_path,...arr(gallery.image_paths).slice(0,2)],'low')}mediaObserver.unobserve(el)}},{rootMargin:'1800px 0px',threshold:.01});
    $$('[data-id],[data-tour],[data-gallery]').forEach(el=>mediaObserver.observe(el));
  }
  function warmMediaAfterCovers(){
    const run=()=>{packages.slice(0,3).forEach(item=>preloadMedia([item.cover_path,...arr(item.image_paths).slice(0,2)],'low'));galleries.slice(0,6).forEach(item=>preloadMedia([item.cover_path,...arr(item.image_paths).slice(0,1)],'low'))};
    if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:2200});else setTimeout(run,1400);
  }
  function warmTarget(target){
    const card=target.closest?.('[data-id]');if(card){const item=cards.find(x=>String(x.id)===String(card.dataset.id));if(item)preloadMedia([item.cover_path,...arr(item.detail_paths)],'high');return}
    const tour=target.closest?.('[data-tour]');if(tour){const item=packages.find(x=>String(x.id)===String(tour.dataset.tour));if(item)preloadMedia([item.cover_path,...arr(item.image_paths)],'high');return}
    const gallery=target.closest?.('[data-gallery]');if(gallery){const item=galleries.find(x=>String(x.id)===String(gallery.dataset.gallery));if(item)preloadMedia([item.cover_path,...arr(item.image_paths)],'high')}
  }
  function revealApp(){document.body.classList.add('appReady');const splash=$('#bootSplash');if(splash)splash.classList.add('done')}
  async function rest(table, query='') {
    const r = await fetch(`${C.SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: apiHeaders });
    if (!r.ok) throw new Error(`${table}: ${r.status}`);
    return r.json();
  }
  async function loadData() {
    try {
      const [g,c,p,ga] = await Promise.all([
        rest('visa_groups','select=*&active=eq.true&order=sort_order.asc'),
        rest('visa_cards','select=*&active=eq.true&order=sort_order.asc'),
        rest('packages','select=*&active=eq.true&order=sort_order.asc'),
        rest('galleries','select=*&active=eq.true&order=sort_order.asc')
      ]);
      groups=g; cards=c; packages=mergeCuratedPackages(p); galleries=ga;
      isLoadingCards=false;
      if(cards.length) renderCards(); else showCardLoading();
      renderPackages(); renderGalleries(); buildTypeChips(); syncContentNavigation();
      observeMediaAhead(); warmMediaAfterCovers();
    } catch (err) {
      console.error(err);
      packages=mergeCuratedPackages([]);
      renderPackages(); syncContentNavigation();
      isLoadingCards=true; showCardLoading();
    } finally {
      revealApp();
    }
  }
  function syncContentNavigation() {
    const packageTab=document.querySelector('.navbtn[data-tab="packages"]');
    const galleryTab=document.querySelector('.navbtn[data-tab="gallery"]');
    if(packageTab) packageTab.hidden=packages.length===0;
    if(galleryTab) galleryTab.hidden=visibleGalleries().length===0;
    const nav=document.querySelector('.nav');
    if(nav) nav.style.setProperty('--nav-columns',galleryTab?.hidden?'3':'4');
    const filterBtn=$('#filterBtn');
    if(filterBtn) filterBtn.style.visibility=cards.length?'visible':'hidden';
  }
  function cardMarkup(c,index=999) {
    const valid=c.validity || (Number(c.days)?`${c.days} Days`:'Check details');
    return `<article class="card" data-id="${esc(c.id)}"><div class="poster"><img loading="${index<20?'eager':'lazy'}" fetchpriority="${index<8?'high':'auto'}" decoding="async" src="${mediaUrl(c.cover_path,c.country)}" onerror="this.onerror=null;this.src=window.__ezyFallback?window.__ezyFallback(this.alt):this.src" alt="${esc(c.country)}"><div class="identity"><div class="flagcircle">${esc(c.flag||'✈️')}</div><div class="country">${esc(c.country)}</div></div><div class="hoverpeek"><span>${esc(c.type||'Visa')}</span><b>${esc(valid)}${c.fee?' · '+esc(c.fee):''}</b><small>View full details</small></div><div class="cardmeta"><div class="metagrid"><div><span class="label">Type</span><span class="value">${esc(c.type||'Visa')}</span></div><div><span class="label">Valid</span><span class="value">${esc(valid)}</span></div></div></div></div><div class="below"><div class="line1">${esc(c.date_label||'Visa assistance')}</div><div class="line2">${esc(c.deadline||'Contact us for current processing details')}</div>${c.fee?`<div class="fee">${esc(c.fee)}</div>`:''}</div></article>`;
  }
  function renderCards() {
    const q=($('#search')?.value||'').trim().toLowerCase();
    let list=cards.filter(c=>!q || [c.country,c.type,c.group_name,c.description].join(' ').toLowerCase().includes(q));
    if(activeType) list=list.filter(c=>c.type===activeType);
    if(activeDays) { const n=Number(activeDays); list=list.filter(c=>n===0?Number(c.days||0)===0:Number(c.days||0)<=n); }
    const groupOrder = groups.length ? groups : [...new Set(cards.map(c=>c.group_name))].map((name,i)=>({name,sort_order:i}));
    let html='',visibleIndex=0;
    for(const g of groupOrder){const items=list.filter(c=>c.group_name===g.name);if(!items.length)continue;html+=`<div class="visaGroup">${esc(cleanGroupName(g.name))}</div>${items.map(c=>cardMarkup(c,visibleIndex++)).join('')}`;}
    if(!html){
      if(isLoadingCards || !cards.length){ showCardLoading(); return; }
      html='<div class="empty">No matching visa options.</div>';
    }
    $('#cardGrid').innerHTML=html;requestAnimationFrame(observeMediaAhead);
  }
  function renderPackages(){
    $('#packageGrid2').innerHTML=packages.map((p,i)=>`<article class="tourCard" data-tour="${esc(p.id)}"><div class="tourCardMedia"><img loading="${i<3?'eager':'lazy'}" fetchpriority="${i<2?'high':'auto'}" decoding="async" src="${mediaUrl(p.cover_path,p.title)}" onerror="this.onerror=null;this.src=window.__ezyFallback(this.alt)" alt="${esc(p.title)}"><div class="tourOverlay"><span>${esc(p.tag||'Travel package')}</span><h2>${esc(p.title)}</h2></div></div><div class="tourCardBody"><p>${esc(p.destination||'')}</p><div class="tourCardFacts"><span>${esc(p.duration||'')}</span>${p.price?`<strong>${esc(p.price)}</strong>`:''}</div></div></article>`).join('') || '<div class="empty">No packages available.</div>';requestAnimationFrame(observeMediaAhead);
  }
  function renderGalleries(){
    const list=visibleGalleries();
    $('#galleryGrid').innerHTML=list.map(g=>{const cover=String(g.cover_path||'').trim() || arr(g.image_paths).find(x=>String(x||'').trim()) || '';return `<button class="galleryCard" data-gallery="${esc(g.id)}"><img loading="lazy" decoding="async" src="${mediaUrl(cover,g.title)}" alt="${esc(g.title)}"><span>${esc(g.title)}</span></button>`}).join('');requestAnimationFrame(observeMediaAhead);
  }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function setVisaSlide(index, animate=true){
    const track=$('#packageTrack');
    if(!track) return;
    const total=currentVisaImages.length || 1;
    currentVisaImageIndex=Math.max(0,Math.min(total-1,index));
    track.style.transition=animate?'transform .30s cubic-bezier(.22,.61,.36,1)':'none';
    track.style.transform=`translate3d(${-currentVisaImageIndex*100}%,0,0)`;
    $$('#packageDots [data-visa-dot]').forEach((dot,i)=>{
      dot.classList.toggle('active',i===currentVisaImageIndex);
      dot.setAttribute('aria-current',i===currentVisaImageIndex?'true':'false');
    });
  }
  function bindVisaSlider(){
    const track=$('#packageTrack');
    const dots=$('#packageDots');
    if(!track || track.dataset.sliderBound==='1') return;
    track.dataset.sliderBound='1';

    let startX=0,startY=0,active=false;
    track.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse' && e.button!==0) return;
      active=true; startX=e.clientX; startY=e.clientY;
      try{track.setPointerCapture(e.pointerId)}catch(_){}
    });
    track.addEventListener('pointerup',e=>{
      if(!active) return;
      active=false;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      if(Math.abs(dx)>38 && Math.abs(dx)>Math.abs(dy)){
        setVisaSlide(currentVisaImageIndex+(dx<0?1:-1));
      }else{
        setVisaSlide(currentVisaImageIndex);
      }
    });
    track.addEventListener('pointercancel',()=>{active=false;setVisaSlide(currentVisaImageIndex)});
    track.addEventListener('dragstart',e=>e.preventDefault());
    dots.addEventListener('click',e=>{
      const dot=e.target.closest('[data-visa-dot]');
      if(dot) setVisaSlide(Number(dot.dataset.visaDot));
    });
  }

  function openCardDetail(id,push=true){
    const c=cards.find(x=>String(x.id)===String(id)); if(!c)return; currentCard=c;
    currentVisaImages=[c.cover_path,...arr(c.detail_paths)].filter(Boolean);preloadMedia(currentVisaImages);
    const sliderItems=currentVisaImages.length?currentVisaImages:[''];

    $('#packageTrack').innerHTML=sliderItems.map((src,i)=>`
      <div class="detailSlide">
        <img loading="${i===0?'eager':'lazy'}" fetchpriority="${i===0?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${c.country} ${i+1}`)}" alt="${esc(c.country)} image ${i+1}" draggable="false">
      </div>`).join('');
    $('#packageDots').innerHTML=sliderItems.length>1
      ? sliderItems.map((_,i)=>`<button type="button" class="detailDot ${i===0?'active':''}" data-visa-dot="${i}" aria-label="Show image ${i+1}" aria-current="${i===0?'true':'false'}"></button>`).join('')
      : '';

    $('#packageFlag').textContent=c.flag||'✈️';
    $('#packageType').textContent=c.type||'Visa';
    $('#packageTitle').textContent=c.country||'';
    $('#packageDesc').textContent=c.description||'';
    $('#packageDays').textContent='Contact now';
    $('#packageDate').textContent='Check now';
    const packagePhone=$('#packagePhone');if(packagePhone)packagePhone.textContent='+91 96563 09061';
    $('#packageDocs').innerHTML=arr(c.documents).map(d=>`<div class="docItem"><span class="docTick">✓</span><span>${esc(d)}</span></div>`).join('');

    showOnly('cardDetail');
    bindVisaSlider();
    setVisaSlide(0,false);
    if(push) history.pushState({view:'cardDetail',id:c.id},'','#visa-'+c.id);
  }

  function setTourSlide(index, animate=true){
    const track=$('#tourTrack');
    if(!track) return;
    const total=currentTourImages.length || 1;
    currentTourImageIndex=Math.max(0,Math.min(total-1,index));
    track.style.transition=animate?'transform .30s cubic-bezier(.22,.61,.36,1)':'none';
    track.style.transform=`translate3d(${-currentTourImageIndex*100}%,0,0)`;
    $$('#tourDots [data-tour-dot]').forEach((dot,i)=>{
      dot.classList.toggle('active',i===currentTourImageIndex);
      dot.setAttribute('aria-current',i===currentTourImageIndex?'true':'false');
    });
  }
  function bindTourSlider(){
    const track=$('#tourTrack');
    const dots=$('#tourDots');
    if(!track || track.dataset.sliderBound==='1') return;
    track.dataset.sliderBound='1';

    let startX=0, startY=0, active=false;
    track.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse' && e.button!==0) return;
      active=true; startX=e.clientX; startY=e.clientY;
      try{ track.setPointerCapture(e.pointerId); }catch(_){}
    });
    track.addEventListener('pointerup',e=>{
      if(!active) return;
      active=false;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      if(Math.abs(dx)>38 && Math.abs(dx)>Math.abs(dy)){
        setTourSlide(currentTourImageIndex+(dx<0?1:-1));
      }else{
        setTourSlide(currentTourImageIndex);
      }
    });
    track.addEventListener('pointercancel',()=>{ active=false; setTourSlide(currentTourImageIndex); });
    track.addEventListener('dragstart',e=>e.preventDefault());

    dots.addEventListener('click',e=>{
      const dot=e.target.closest('[data-tour-dot]');
      if(dot) setTourSlide(Number(dot.dataset.tourDot));
    });
  }

  function openTour(id,push=true){
    const p=packages.find(x=>String(x.id)===String(id)); if(!p)return; currentTour=p;
    currentTourImages=[p.cover_path,...arr(p.image_paths)].filter(Boolean);preloadMedia(currentTourImages);
    const sliderItems=currentTourImages.length?currentTourImages:[''];

    $('#tourTrack').innerHTML=sliderItems.map((src,i)=>`<div class="tourSlide"><img loading="${i===0?'eager':'lazy'}" fetchpriority="${i===0?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${p.title} ${i+1}`)}" onerror="this.onerror=null;this.src=window.__ezyFallback(this.alt)" alt="${esc(p.title)} image ${i+1}" draggable="false"></div>`).join('');
    $('#tourDots').innerHTML=sliderItems.length>1
      ? sliderItems.map((_,i)=>`<button class="tourDot ${i===0?'active':''}" type="button" data-tour-dot="${i}" aria-label="Show image ${i+1}" aria-current="${i===0?'true':'false'}"></button>`).join('')
      : '';

    $('#tourTag').textContent=p.tag||'Travel package';
    $('#tourTitle').textContent=p.title||'';
    $('#tourDestination').textContent=p.destination||'';
    $('#tourSummary').textContent=p.summary||'';
    $('#tourDuration').textContent=p.duration||'Check details';
    $('#tourPrice').textContent=p.price||'Ask for price';
    const factWrap=$('#tourFacts');
    if(factWrap){
      factWrap.querySelectorAll('.tourExtraFact').forEach(el=>el.remove());
      factWrap.insertAdjacentHTML('beforeend',arr(p.facts).map(x=>`<div class="tourFact tourExtraFact"><small>${esc(x.label||'Detail')}</small><strong>${esc(x.value||'')}</strong></div>`).join(''));
    }

    $('#tourHighlights').innerHTML=arr(p.highlights).map(x=>`<span class="highlightChip">${esc(x)}</span>`).join('');

    $('#tourItinerary').innerHTML=arr(p.itinerary).map((x,i)=>`
      <article class="dayCard">
        <div class="dayTop">
          <div>
            <div class="dayNo">DAY ${esc(x.day||i+1)}</div>
            <h3>${esc(x.title||'Day plan')}</h3>
          </div>
          ${x.meal?`<span class="meal">${esc(x.meal)}</span>`:''}
        </div>
        <p>${esc(x.text||x.description||'')}</p>
      </article>`).join('');

    $('#tourInclusions').innerHTML=arr(p.inclusions).map(x=>`<div class="cleanItem"><span class="cleanIcon">✓</span><span>${esc(x)}</span></div>`).join('');
    $('#tourExclusions').innerHTML=arr(p.exclusions).map(x=>`<div class="cleanItem"><span class="cleanIcon">✓</span><span>${esc(x)}</span></div>`).join('');
    const extraSections=$('#tourExtraSections');
    if(extraSections) extraSections.innerHTML=arr(p.sections).map(section=>`<section class="tourBlock"><h2>${esc(section.title||'More details')}</h2><div class="tourExtraList">${arr(section.items).map(x=>`<div class="tourExtraItem"><span>${esc(x)}</span></div>`).join('')}</div></section>`).join('');
    $('#tourTerms').innerHTML=arr(p.terms).map(x=>`<div class="tourTerm">${esc(x)}</div>`).join('');

    if($('#tourSourceNote')) $('#tourSourceNote').textContent='';
    showOnly('tourDetail');
    bindTourSlider();
    setTourSlide(0,false);

    if(push) history.pushState({view:'tourDetail',id:p.id},'','#tour-'+p.id);
  }
  function openGallery(id,push=true){
    const g=galleries.find(x=>String(x.id)===String(id)); if(!g)return; currentGallery=g;preloadMedia([g.cover_path,...arr(g.image_paths)]); $('#detailTitle').textContent=g.title||''; $('#detailDesc').textContent=g.description||'';
    const imgs=arr(g.image_paths); $('#photoGrid').innerHTML=imgs.map((src,i)=>`<button class="photo" data-photo="${i}"><img loading="lazy" decoding="async" fetchpriority="auto" src="${mediaUrl(src,`${g.title} ${i+1}`)}" alt="${esc(g.title)} image ${i+1}"></button>`).join('') || '<div class="empty">No photos uploaded yet.</div>';
    showOnly('galleryDetail'); if(push) history.pushState({view:'galleryDetail',id:g.id},'','#gallery-'+g.id);
  }
  function updateBackButton(){
    const btn=$('#backBtn');
    if(!btn) return;
    const shouldShow=currentView!=='explorePane' || window.scrollY>80;
    btn.classList.toggle('is-hidden',!shouldShow);
  }
  function showOnly(view,scrollTop=true){
    currentView=view;
    const ids=['explorePane','packagesPane','servicesPane','galleryPane','tourDetail','cardDetail','galleryDetail'];
    ids.forEach(id=>{
      const el=$('#'+id);
      if(el) el.style.display=id===view?'block':'none';
    });
    $('#tools').style.display=view==='explorePane'?'grid':'none';
    $$('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab===({
      explorePane:'explore',packagesPane:'packages',servicesPane:'services',galleryPane:'gallery'
    }[view]||'')));
    if(scrollTop) window.scrollTo({top:0,behavior:'auto'});
    requestAnimationFrame(updateBackButton);
  }
  function showTab(tab,push=true){
    const map={explore:'explorePane',packages:'packagesPane',services:'servicesPane',gallery:'galleryPane'};
    const view=map[tab]||'explorePane';
    showOnly(view,true);
    if(push) history.pushState({view},'','#'+tab);
  }
  function handleBack(){
    if(window.scrollY>80){
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    if(currentView!=='explorePane'){
      history.back();
      return;
    }
    updateBackButton();
  }
  function buildTypeChips(){ const types=[...new Set(cards.map(c=>c.type).filter(Boolean))]; $('#typeChips').innerHTML=types.map(t=>`<button class="chip" data-type="${esc(t)}">${esc(t)}</button>`).join(''); $$('[data-type]').forEach(b=>b.onclick=()=>{activeType=activeType===b.dataset.type?'':b.dataset.type; $$('[data-type]').forEach(x=>x.classList.toggle('active',x.dataset.type===activeType));}); }
  async function submitFeedback(e){
    e.preventDefault(); const name=$('#fbName').value.trim(), phone=$('#fbPhone').value.trim(), message=$('#fbMessage').value.trim(); if(!message)return;
    const btn=$('#feedbackForm .send'); const old=btn.textContent; btn.disabled=true; btn.textContent='Sending…';
    try{ const r=await fetch(`${C.SUPABASE_URL}/rest/v1/feedback`,{method:'POST',headers:{...apiHeaders,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name,phone,message})}); if(!r.ok) throw new Error(await r.text()); $('#feedbackForm').reset(); let s=$('#feedbackStatus'); if(!s){s=document.createElement('div');s.id='feedbackStatus';s.className='feedbackSuccess';$('#feedbackForm').appendChild(s)} s.textContent='Thank you. Your feedback has been sent.'; }
    catch(err){console.error(err); alert('Could not send feedback right now. Please try again.');} finally{btn.disabled=false;btn.textContent=old;}
  }
  function openLightbox(g,index=0){currentGallery=g;currentImageIndex=index;$('#lbTitle').textContent=g.title;const imgs=arr(g.image_paths);$('#lbTrack').innerHTML=imgs.map((src,i)=>`<div class="lbSlide"><img loading="${i===index?'eager':'lazy'}" fetchpriority="${i===index?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${g.title} ${i+1}`)}" alt="${esc(g.title)}"></div>`).join('');$('#lightbox').classList.add('open');document.body.style.overflow='hidden';requestAnimationFrame(()=>{$('#lbTrack').scrollLeft=$('#lbTrack').clientWidth*index;updateCount(index)})}
  function updateCount(i){currentImageIndex=i;$('#lbCount').textContent=`${i+1} / ${arr(currentGallery?.image_paths).length}`}
  function closeLightbox(){$('#lightbox').classList.remove('open');document.body.style.overflow=''}
  document.addEventListener('contextmenu',e=>{if(e.target.closest('img'))e.preventDefault()});
  document.addEventListener('dragstart',e=>{if(e.target.closest('img'))e.preventDefault()});
  document.addEventListener('DOMContentLoaded',()=>{
    $('#year').textContent=new Date().getFullYear();showCardLoading();showPackageLoading();showGalleryLoading();setTimeout(revealApp,900);loadData();
    document.addEventListener('pointerover',e=>{if(e.pointerType==='mouse')warmTarget(e.target)},{passive:true});document.addEventListener('touchstart',e=>warmTarget(e.target),{passive:true});
    $('#search').addEventListener('input',renderCards); $('#cardGrid').onclick=e=>{const c=e.target.closest('[data-id]');if(c)openCardDetail(c.dataset.id)}; $('#packageGrid2').onclick=e=>{const c=e.target.closest('[data-tour]');if(c)openTour(c.dataset.tour)}; $('#galleryGrid').onclick=e=>{const c=e.target.closest('[data-gallery]');if(c)openGallery(c.dataset.gallery)}; $('#photoGrid').onclick=e=>{const b=e.target.closest('[data-photo]');if(b&&currentGallery)openLightbox(currentGallery,Number(b.dataset.photo))};
    $$('.navbtn').forEach(b=>b.onclick=()=>showTab(b.dataset.tab)); $('#backBtn').onclick=handleBack; window.addEventListener('scroll',updateBackButton,{passive:true}); $('#filterBtn').onclick=()=>$('#filterModal').classList.add('open'); $('#closeFilter').onclick=()=>$('#filterModal').classList.remove('open'); $('#applyFilter').onclick=()=>{$('#filterModal').classList.remove('open');renderCards()}; $('#clearFilter').onclick=()=>{activeType='';activeDays='';$$('.chip').forEach(x=>x.classList.remove('active'));renderCards()}; $$('[data-days]').forEach(b=>b.onclick=()=>{activeDays=activeDays===b.dataset.days?'':b.dataset.days;$$('[data-days]').forEach(x=>x.classList.toggle('active',x.dataset.days===activeDays))});
    $('#feedbackForm').onsubmit=submitFeedback; $('#contactBtn').onclick=()=>window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent('Hi EzyGo Travels, I would like to make a travel enquiry.')}`,'_blank'); $('#packageEnquire').onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like details about ${currentCard.country}.`)}`,'_blank'); const validityFact=$('#packageValidityFact');if(validityFact)validityFact.onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, please confirm visa validity for ${currentCard.country}.`)}`,'_blank'); const availabilityFact=$('#packageAvailabilityFact');if(availabilityFact)availabilityFact.onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, please check current availability/details for ${currentCard.country}.`)}`,'_blank'); $('#tourEnquire').onclick=()=>currentTour&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like details about ${currentTour.title}.`)}`,'_blank');
    $$('.accBtn').forEach(btn=>btn.onclick=()=>btn.parentElement.classList.toggle('open')); $('#lbClose').onclick=closeLightbox; $('#lbPrev').onclick=()=>{if(!currentGallery)return;const n=Math.max(0,currentImageIndex-1);$('#lbTrack').scrollTo({left:$('#lbTrack').clientWidth*n,behavior:'smooth'});updateCount(n)}; $('#lbNext').onclick=()=>{if(!currentGallery)return;const n=Math.min(arr(currentGallery.image_paths).length-1,currentImageIndex+1);$('#lbTrack').scrollTo({left:$('#lbTrack').clientWidth*n,behavior:'smooth'});updateCount(n)};
    window.addEventListener('popstate',e=>{const st=e.state;if(st?.view==='cardDetail')openCardDetail(st.id,false); else if(st?.view==='tourDetail')openTour(st.id,false); else if(st?.view==='galleryDetail')openGallery(st.id,false); else showOnly(st?.view||'explorePane',true)}); history.replaceState({view:'explorePane'},'',location.pathname); currentView='explorePane'; updateBackButton();
  });
})();
