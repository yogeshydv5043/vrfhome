/* EDIT THIS FILE to manage Home → WORDS THAT MATTER reviews.
   Keep reviews in the order you want them displayed. No HTML editing required.
   IMPORTANT: this is a PUBLIC file, including unpublished entries. Do not put
   private contact details or confidential drafts here. Publish only genuine
   customer feedback you have permission to display. See README.md section 4.

   HOW TO ADD A REAL REVIEW
   ------------------------
   1. Copy the template block below into the `reviews: []` array.
   2. Fill in the real customer name, their actual words, and the real date.
   3. Set `published: true` only after you have the customer's permission.
   4. If the review exists publicly (Google, JustDial, magicpin), paste that
      page's https:// link into `sourceUrl` so visitors can verify it.

   TEMPLATE — copy everything between the braces:
     {
       published: false,
       name: "",          // Real customer name, as they agreed to display it
       quote: "",         // Their actual words. Do not paraphrase or invent.
       projectType: "",   // e.g. "3BHK Apartment" — the real scope
       location: "",      // e.g. "Sector 93, Gurugram" — the real area
       rating: 5,         // Whole number 1–5, or remove this line
       date: "",          // YYYY-MM-DD, the real date the feedback was given
       sourceLabel: "",   // e.g. "Google" — where it was originally posted
       sourceUrl: "",     // https:// link to the original, if public
     },
*/
window.VRF_REVIEWS_CONFIG = {
  enabled: true,

  /* With no published reviews the section shows a short honest message.
     Options: "message" (recommended), "hide", or "demo".
     "demo" is intentionally NOT used — the studio publishes only real
     customer feedback, never illustrative or sample testimonials. */
  emptyState: "message",

  /* No customer reviews are published yet. The studio's public rating is
     shown as a verifiable aggregate on the Home page instead. Add real,
     permission-cleared feedback here using the template above. */
  reviews: [],

  /* Optional seed content for reviews/index.html while Supabase is not set up.
     Keep this empty unless entries are genuine, permission-cleared reviews. */
  pageReviews: [],
};
