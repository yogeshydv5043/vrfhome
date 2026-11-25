/* Verified studio information for VRF Home Interiors Private Limited.
   This is the only business-data source used across the website. */
const SITE_CONFIG = Object.freeze({
  verifiedBusiness: true, // Business details below are verified studio information.
  brandName: "VRF HOME INTERIORS",
  logo: "media/brand/logo/vrf-logo.png",
  logoLight: "media/brand/logo/vrf-logo-light.png",
  designerName: "Ritesh Kumar",
  designerRole: "Director & Principal Designer",
  designerBiography:
    "Ritesh Kumar is a founding director of VRF Home Interiors Private Limited and leads the studio from its Sector 93 workshop and display space in Gurugram. He works directly with every client on layout, joinery and material selection, translating how a family actually lives into practical, well-made interiors for homes and commercial spaces across Gurugram and the NCR.",
  designerPortrait: "media/about/interior-designer-professional-office-portrait.webp", // Studio portrait path. Empty keeps the brand mark in the portrait frame.
  /* Alt text read aloud by screen readers in place of the portrait. Describe
     the person and the setting. Leaving this empty falls back to the designer's
     name and role, which is correct but tells a visitor nothing about the photo. */
  designerPortraitAlt:
    "Ritesh Kumar, Director and Principal Designer of VRF Home Interiors, seated at his desk in the studio office in front of a dark panelled wall and backlit display shelving.",
  /* Short line printed across the bottom of the portrait. Leave empty for no caption. */
  designerPortraitCaption: "Ritesh Kumar at the studio, Sector 93, Gurugram",
  experience:
    "VRF Home Interiors Private Limited was incorporated on 10 September 2020 (CIN U36999HR2020PTC089195) and operates from Sector 93, Gurugram. The studio delivers residential and commercial interior design, modular kitchens, custom joinery and renovation work across Gurugram and the National Capital Region.",
  phone: "+91 99990 88992",
  email: "vrf.interiors@gmail.com",
  whatsapp: "919999088992", // International digits only, without + or spaces.
  address: {
    street: "Shop No. 11, Sector 93 Road, near Baba Jotram Chowk",
    area: "Hayatpur, Sector 93",
    city: "Gurugram",
    state: "Haryana",
    postalCode: "122001",
    country: "India",
  },
  siteCredit: "RITPLPRO",
  siteCreditUrl: "https://ritplpro.com/",
  businessHours: {
    summary: "Monday–Saturday: 10:00 AM – 7:00 PM · Sunday: Closed",
    weekdays: "10:00 AM – 7:00 PM",
    weekend: "Closed",
  },
  /* Add each studio profile URL here as it goes live. Empty values hide that icon. */
  /* Official studio profiles. Only fill in accounts that really exist — an
     empty string keeps the icon on the page but turns it into a "coming soon"
     prompt instead of a dead link. Store clean canonical profile URLs here:
     share links copied from the apps carry personal, expiring tracking tokens
     (?si=, ?stkn=, ?utm_source=qr) that must not be published. */
  /* Only platforms listed here get an icon in the footer. X and Threads were
     removed on the owner's instruction in September 2026; their <a> elements
     were deleted from all 21 pages and their SVGs from media/brand/social/.
     To bring a platform back: restore the key here with its profile URL, and
     copy one of the surviving <a data-social="..."> blocks in the footer,
     swapping the name and the icon file. A key left as an empty string keeps
     its icon but makes it prompt a call instead of opening a profile --
     which is what facebook does now, until a page exists. */
  social: {
    instagram: "https://www.instagram.com/vrf__homeinteriors/",
    facebook: "",
    youtube: "https://www.youtube.com/@vrf__homeinteriors",
  },
  siteUrl: "https://vrfhomeinteriors.com/",
  legalName: "VRF Home Interiors Private Limited",
  cin: "U36999HR2020PTC089195",
  incorporationDate: "10 September 2020",
  effectiveDate: "22 September 2026",
  jurisdiction: "Gurugram, Haryana, India",
  /* Studio location used for the Contact page map pin (URL-encoded). */
  mapEmbedUrl:
    "https://www.google.com/maps?q=VRF%20HOME%20INTERIORS%20PVT.%20LTD.%2C%20Shop%20No.11%2C%20Sector%2093%20Rd%2C%20near%20Jotram%20Chowk%2C%20Hayatpur%2C%20Sector%2093%2C%20Gurugram%2C%20Haryana%20122001&z=16&output=embed",
});

/* Same-origin MilesWeb PHP endpoint. SMTP credentials belong only in the private server config. */
const FORM_CONFIG = Object.freeze({
  endpoint: "api/enquiry.php",
  csrf: true,
  timeoutMs: 30000,
  /* Required response contract: HTTP 2xx and JSON {"success":true}, returned only after acceptance. */
  successField: "success",
});

/* Tracking is disabled. The site loads no analytics, tags or third-party
   trackers, so there is no endpoint to configure and no cookie banner needed.
   If analytics are ever added, disclose them in the Privacy Policy first. */
const ANALYTICS_CONFIG = Object.freeze({
  enabled: false,
});
