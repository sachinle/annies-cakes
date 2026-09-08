// ============================================================
// ALL WEBSITE CONTENT LIVES HERE.
//
// One file, no database. Every page reads from this, so changing
// wording, images, or contact details means editing this file only —
// no CMS, no queries on page load, nothing to keep in sync.
//
// The only things still read from the database are the ones that
// genuinely change per visitor: the product catalogue, orders, and
// delivery pincodes.
//
// IMAGES: drop your photos into public/images/ using the filenames
// below and they appear automatically. Until a file exists, the site
// shows a labelled placeholder rather than a broken image.
// ============================================================

export const site = {
  name: "Annie's Homemade Cakes",
  shortName: "Annie's Cakes",
  tagline: "Taste the delight",

  // ── Contact ─────────────────────────────────────────────
  contact: {
    phone: "9524144650",
    whatsapp: "919524144650", // full international format, no +
    email: "sachinannie172@gmail.com",
    address:
      // Spelled to match the Google Business Profile character for
      // character. NAP consistency is a ranking signal, and the site
      // previously said "Pari Nagar / Arisipalayam" against the
      // profile's "Paari Nagar / Arasipalayam", which reads as a
      // different address.
      "5/140/8 Paari Nagar, Nachipalyam, Thambagoundenpalayam, Arasipalayam, Madukkarai",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641032",
    hours: "Mon – Sat, 9am – 8pm",
    mapsUrl: "https://maps.app.goo.gl/3gAZbRkVEwxkdbJn9",
    // The exact pin from the Google Business Profile. Emitted as
    // GeoCoordinates in the schema, which is what lets Google place
    // the business precisely rather than geocoding the address text.
    lat: 10.8718645,
    lng: 76.9711166,
    reviewUrl: "https://g.page/r/CUKoCxBe-E7lEBM/review",
    instagram: "https://www.instagram.com/annieshomemadecakes",
    facebook: "https://www.facebook.com/profile.php?id=100091778577677",
    // Leave blank to hide the icon in the footer.
    // Threads lives on threads.com now; threads.net still resolves but
    // redirects. Both were checked before adding — a dead link in
    // sameAs is worse than an absent one.
    threads: "https://www.threads.com/@annieshomemadecakes",
    youtube: "https://www.youtube.com/@anniescakesandlifestyle1183",
  },

  // ── Hero ────────────────────────────────────────────────
  hero: {
    eyebrow: "Homemade Cakes in Coimbatore",
    headingTop: "Taste",
    headingAccent: "the",
    headingBottom: "Delight",
    body: "Every cake is baked fresh in our home kitchen once you order — never pulled from a shelf. Tell us what you're celebrating and we'll make the cake part unforgettable.",
    primaryCta: { label: "Order a Cake", href: "/products" },
    secondaryCta: { label: "Custom Cake", href: "/contact" },
    // Rotates with the photos. Same shape as the block above, so each
    // slide reads identically — only the words change.
    slides: [
      {
        eyebrow: "Homemade Cakes in Coimbatore",
        headingTop: "Taste",
        headingAccent: "the",
        headingBottom: "Delight",
        body: "Every cake is baked fresh in our home kitchen once you order — never pulled from a shelf. Tell us what you're celebrating and we'll make the cake part unforgettable.",
      },
      {
        eyebrow: "Baked To Order",
        headingTop: "Fresh",
        headingAccent: "every",
        headingBottom: "Time",
        body: "Nothing sits in a display case waiting for a buyer. We start mixing after you order, so what reaches you was made for you — usually the same day.",
      },
      {
        eyebrow: "Your Design, Our Kitchen",
        headingTop: "Made",
        headingAccent: "just",
        headingBottom: "For You",
        body: "Size, colours, message, theme — tell us the idea and we'll build the cake around it. Send a picture and we'll tell you honestly whether we can do it justice.",
      },
      {
        eyebrow: "Over 1,000 Orders",
        headingTop: "Trusted",
        headingAccent: "by",
        headingBottom: "Coimbatore",
        body: "We've never advertised. People order a cake, their guests ask where it came from, and those guests become next week's orders. That's still how it works.",
      },
      {
        eyebrow: "Straight From Our Kitchen",
        headingTop: "Real",
        headingAccent: "home",
        headingBottom: "Baking",
        body: "No factory line and no middleman. The person who takes your order is the person who bakes it, and you can ask them anything about how it's made.",
      },
    ],
    // Cross-fades every 5 seconds inside a circular frame. Square-ish
    // photos with the cake roughly centred work best.
    images: [
      { src: "/images/hero/cake-1.jpg", alt: "Raspberry cheesecake topped with pink macarons and edible flowers" },
      { src: "/images/hero/cake-2.jpg", alt: "Chocolate drip cake with piped swirls on a cake stand" },
      { src: "/images/hero/cake-3.jpg", alt: "Chocolate cake topped with fresh berries and a sparkler" },
    ],
  },

  // ── Marquee strip under the hero ────────────────────────
  marquee: [
    "Freshly Baked Daily",
    "No Preservatives",
    "100% Homemade",
    "Custom Designs",
    "Made to Order",
    "Coimbatore Delivery",
  ],

  // ── Trust numbers. Real figures only. ───────────────────
  stats: [
    { value: "1000+", label: "Orders delivered" },
    { value: "200+", label: "Happy customers" },
    { value: "100%", label: "Made at home" },
    { value: "0", label: "Shelf-sitting cakes" },
  ],

  // ── About ───────────────────────────────────────────────
  about: {
    heading: "About Annie's Cakes",
    body: "We're a home bakery in Coimbatore. Every cake is made to order in our own kitchen — mixed, baked, and decorated by hand, usually the same day you collect it. No factory line, no display case, no cake that's been sitting since yesterday.",
    body2: "Because we bake one order at a time, we can change almost anything: the size, the colours, the message, the flavour. If you have a picture of what you want, send it over and we'll tell you honestly whether we can do it.",
    image: { src: "/images/about.jpg", alt: "A row of cupcakes with pastel icing and sprinkles" },
  },

  // ── Why choose us ───────────────────────────────────────
  whyUs: {
    heading: "Why Choose Us?",
    items: [
      {
        title: "Baked at Home",
        body: "Made in our own clean kitchen, not a factory. You can ask us anything about how it's prepared.",
        icon: "home",
      },
      {
        title: "Made to Order",
        body: "We start baking after you order, so it reaches you as fresh as it possibly can.",
        icon: "clock",
      },
      {
        title: "Your Design",
        body: "Colours, message, theme, size — tell us the idea and we'll build the cake around it.",
        icon: "sparkle",
      },
    ],
  },

  // ── How ordering works ──────────────────────────────────
  howItWorks: {
    heading: "How Ordering Works",
    subheading: "Four steps, and nothing is charged until we've spoken.",
    steps: [
      { title: "Pick your cake", body: "Browse the menu and add what you'd like to your basket." },
      { title: "Tell us the details", body: "Size, message, colour, and the date you need it by." },
      { title: "We confirm", body: "We call or message you to check everything before baking." },
      { title: "Fresh on the day", body: "Baked close to your collection time, never in advance." },
    ],
  },

  // ── FAQ ─────────────────────────────────────────────────
  faq: {
    heading: "FAQs",
    items: [
      {
        q: "How early should I order?",
        a: "At least a day ahead for most cakes. For custom designs or larger orders, give us three or four days so we can plan properly.",
      },
      {
        q: "Can I ask for a specific theme or colour?",
        a: "Absolutely — that's most of what we do. Tell us the idea when you order and we'll tell you honestly whether we can pull it off.",
      },
      {
        q: "Do you deliver?",
        a: "To selected areas around Coimbatore. The checkout checks your pincode. If we don't cover you, you're welcome to collect, or arrange your own courier.",
      },
      {
        q: "How do I pay?",
        a: "Nothing is charged when you place a request. We confirm the details and the final price with you first, then raise the bill.",
      },
      {
        q: "Can I cancel my order?",
        a: "Yes, as long as we haven't started baking. Just call or message us as soon as you can.",
      },
    ],
  },

  // ── Gallery. Add files to public/images/gallery/ ────────
  gallery: {
    heading: "From Our Kitchen",
    subheading: "Cakes we've made for real orders.",
    images: [
      { src: "/images/gallery/cake-01.jpg", alt: "Chocolate birthday cake with party hats and a banner" },
      { src: "/images/gallery/cake-02.jpg", alt: "Rainbow layer cake with sprinkles, cut to show the layers" },
      { src: "/images/gallery/cake-03.jpg", alt: "Slice of raspberry and pistachio layer cake" },
      { src: "/images/gallery/cake-04.jpg", alt: "Vanilla cupcakes topped with icing and sprinkles" },
      { src: "/images/gallery/cake-05.jpg", alt: "Chocolate cupcake with mint buttercream" },
      { src: "/images/gallery/cake-06.jpg", alt: "Vanilla cupcake with cream and blueberries" },
    ],
  },

  // ── Most loved ──────────────────────────────────────────
  // These are the items customers actually name in their Google
  // reviews, not a guess at what sells.
  mostLoved: {
    heading: "Most Loved",
    subheading: "The ones customers keep naming in their reviews.",
    items: [
      { name: "Chocolate Brownie", note: "Mentioned more than anything else" },
      { name: "Choco Truffle", note: "The one people come back for" },
      { name: "Chocolate Cup Cakes", note: "Made with homemade cream" },
      { name: "Butter Tea Cake", note: "Simple, soft, and moreish" },
      { name: "Vanilla", note: "Fresh cream, never too sweet" },
      { name: "Dream Cake", note: "A regular request for celebrations" },
    ],
  },

  // ── Occasions ───────────────────────────────────────────
  occasions: {
    heading: "What Are We Baking For?",
    subheading:
      "Tell us the occasion and we'll build the cake around it — size, colours, and message included.",
    items: [
      { title: "Birthdays", body: "From bento cakes for two to a full kilo for the whole family." },
      { title: "Anniversaries", body: "Something a little more elegant, decorated the way you'd like." },
      { title: "Baby Showers & Naming Days", body: "Soft colours, gentle flavours, and a message piped on top." },
      { title: "Farewells & Office Treats", body: "Brownies and cupcakes by the box, ready when you need them." },
      { title: "Festivals", body: "Plum cakes at Christmas, and sweets for the rest of the calendar." },
      { title: "Just Because", body: "No occasion needed. A good cake is its own reason." },
    ],
  },

  // ── Testimonials ────────────────────────────────────────
  // Real reviews left on our Google Business Profile, reproduced as
  // written. Nothing here is invented or edited for flattery.
  testimonials: {
    heading: "Our Customers Love Us",
    subheading: "Real reviews, left on Google by people who ordered from us.",
    items: [
      {
        name: "Sachin Immanuel Leo .S",
        when: "11 months ago",
        rating: 5,
        text: "I ordered the Black Currant Ice Cake and it was a masterpiece — moist, rich, and perfectly balanced in sweetness. You can tell the ingredients are fresh and of premium quality. What really stood out was the customer service — polite, patient, and truly helpful in guiding me through their varieties.",
      },
      {
        name: "Peaceful Soul",
        when: "a year ago",
        rating: 5,
        text: "Ordered half kg of choco truffle. Awesome taste and look! Thanks for making the occasion memorable with the beautiful cake. The follow up and delivery was good and your gesture towards the customer is really very kind.",
      },
      {
        name: "Ramya Krishnan",
        when: "2 years ago",
        rating: 5,
        text: "Our favourite place to get cakes whenever we need. Compared to other cake shops, here cakes are so fresh, soft and creamy. At reasonable price you'll get delicious handmade cakes. Just give a try, you'll love it!",
      },
      {
        name: "yamuna ramesh",
        when: "a year ago",
        rating: 5,
        text: "One of the best places to treat your taste buds. They have so much variety of tasty fresh cream cakes, brownies, tea cakes and much more. Cake will be so soft and juicy. Must try brownies here at affordable prices. I tried customization here — they gave a very nice outcome!",
      },
      {
        name: "Jaishni C S",
        when: "7 months ago",
        rating: 5,
        text: "Brought brownie cake for my friend's birthday. The taste is awesome and the look was so elegant, and the delivery was on time. Happy with the service!",
      },
      {
        name: "Sukhi Renita Chandrasekar",
        when: "a year ago",
        rating: 5,
        text: "I ordered blueberry vanilla cake and cupcakes for my son's birthday party. It was nicely decorated, looks awesome, and the taste was yummy and delicious. Everyone enjoyed the taste.",
      },
      {
        name: "Anuj Kanagaraj",
        when: "8 months ago",
        rating: 5,
        text: "It was a delicious experience in my recent days! You were maintaining the very good taste, and the packing was cute and tidy.",
      },
      {
        name: "Karthik",
        when: "7 months ago",
        rating: 5,
        text: "Good work. I really like that cake. My neighbours were also asking where to buy it. It's really very tasty. Thanks for your lovable work!",
      },
      {
        name: "V Mohana",
        when: "11 months ago",
        rating: 5,
        text: "Timely delivery, freshness, excellent taste and presentation, good customer service, secure packaging, and accurate design fulfillment for us.",
      },
      {
        name: "Keerthi Ramesh",
        when: "7 months ago",
        rating: 5,
        text: "The cake was beautifully presented and tasted amazing. Excellent work. Each bite was rich and flavorful. Truly enjoyed it!",
      },
      {
        name: "Abinav.S.T",
        when: "a year ago",
        rating: 5,
        text: "I had chocolate cupcakes with ice cream on top which was awesome, and they use homemade cream which is very good.",
      },
      {
        name: "dhivya ramakrishnan",
        when: "8 months ago",
        rating: 5,
        text: "Best baking and taste around the area.",
      },
      {
        name: "Guru Prasath.N",
        when: "a year ago",
        rating: 5,
        text: "Excellent cake. Dream cake and plum cake was perfect, with reasonable price.",
      },
      {
        name: "Devi Sanjai",
        when: "a year ago",
        rating: 5,
        text: "Most delicious and affordable desserts.",
      },
      {
        name: "JAS",
        when: "a year ago",
        rating: 5,
        text: "Tasty cakes I have never ever tasted in my life. Wonderful!",
      },
      {
        name: "Yasar Deen",
        when: "a year ago",
        rating: 5,
        text: "The cakes were awesome and the brownie was top notch.",
      },
      {
        name: "Gokul M",
        when: "a year ago",
        rating: 5,
        text: "Fresh cakes and good packaging.",
      },
      {
        name: "Safeer Hameed",
        when: "11 months ago",
        rating: 5,
        text: "Tasty and hygienic.",
      },
      {
        name: "DHINA G S",
        when: "a year ago",
        rating: 5,
        text: "The cupcakes were awesome! Going to give more orders in future.",
      },
      {
        name: "Sastha Sastha",
        when: "a year ago",
        rating: 5,
        text: "Awesome and fantastic taste and packing process.",
      },
      {
        name: "S ARUN KUMAR",
        when: "2 years ago",
        rating: 5,
        text: "Delicious dream cake!",
      },
      {
        name: "Naciketha Karunanithi",
        when: "a year ago",
        rating: 5,
        text: "Everything is wonderful.",
      },
    ],
  },

  // ── Final CTA ───────────────────────────────────────────
  finalCta: {
    heading: "Planning something special?",
    body: "Let's make the cake part unforgettable.",
    cta: { label: "Order Your Cake", href: "/products" },
  },

  // ── About page ──────────────────────────────────────────
  // Written from what's actually true: started 2019, home kitchen,
  // 1000+ orders, and the things customers repeatedly praise in their
  // reviews. Nothing invented.
  aboutPage: {
    eyebrow: "Our Story",
    heading: "It started with one cake, in 2019.",
    lede: "Annie's Cakes began the way most home bakeries do — with a birthday, a home oven, and someone saying \"you should really sell these.\"",
    chapters: [
      {
        year: "2019",
        title: "The first order",
        body: "What started as baking for family turned into a first paid order, then a second. There was no shop and no signboard — just a home kitchen in Coimbatore, a set of tins, and the decision that if we were going to do this, every cake would be made properly or not at all.",
      },
      {
        year: "2021",
        title: "Word got around",
        body: "We never advertised. People ordered a cake, their guests asked where it came from, and those guests became the next week's orders. That is still, to this day, where most of our work comes from — which is exactly why we've never been tempted to cut a corner to save an hour.",
      },
      {
        year: "2023",
        title: "More than birthday cakes",
        body: "Brownies, tea cakes, cupcakes, plum cakes at Christmas. Customers kept asking, so we kept learning. The chocolate brownie in particular took on a life of its own — it's the single most mentioned thing in our reviews.",
      },
      {
        year: "Today",
        title: "Over a thousand orders on",
        body: "More than 1,000 orders and 200 customers later, the method hasn't changed. We still bake to order, still work from the same home kitchen, and you still speak to the person who is actually making your cake.",
      },
    ],
    valuesHeading: "What we won't compromise on",
    values: [
      {
        title: "Baked after you order",
        body: "Nothing sits in a display case. Your cake is mixed and baked close to the day you need it, which is why we ask for a little notice.",
      },
      {
        title: "A kitchen you could walk into",
        body: "It's our own home kitchen, and it's kept that way. Ask us anything about how your cake is prepared — we'd rather you asked than wondered.",
      },
      {
        title: "Honest about what we can do",
        body: "If you send a design we can't do justice to, we'll say so rather than take the order and disappoint you. That's cost us orders. We'd do it again.",
      },
      {
        title: "One conversation, start to finish",
        body: "No call centre, no order number passed between staff. The person who confirms your order is the person who bakes it.",
      },
    ],
    closing: {
      heading: "Come and try one",
      body: "Whether it's a birthday, an anniversary, or a Tuesday that needs improving — we'd love to bake for you.",
    },
  },

  // ── SEO defaults ────────────────────────────────────────
  seo: {
    // Kept under ~60 characters so Google shows it whole, and leads with
    // the phrase people actually search: "homemade cakes Coimbatore".
    title: "Best Homemade Cakes in Coimbatore | No Preservatives",
    // Under ~155 characters for the same reason. Every claim here is
    // true of the business — nothing invented to chase a keyword.
    description:
      "Freshly made homemade cakes in Coimbatore, baked to order with no preservatives. Birthday cakes, bento cakes, brownies and custom designs, delivered locally.",
  },
} as const;

// ── Derived helpers ────────────────────────────────────────

export const fullAddress = [
  site.contact.address,
  site.contact.city,
  site.contact.pincode,
].filter(Boolean).join(", ");

/** tel: needs digits only — spaces break some mobile dialers. */
export function telHref(): string {
  return `tel:${site.contact.phone.replace(/[^\d+]/g, "")}`;
}

/** wa.me needs the full international number with no plus sign. */
export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${site.contact.whatsapp.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
