/* EDIT THIS FILE to choose which of the studio's own work appears on the Home
   page, in the "FROM OUR OWN PROJECTS" strip. No HTML editing required.

   HOW IT WORKS
   ------------
   You do not paste photographs or captions here. You only list the `id` of
   items that already exist in js/media-data.js — the same list the Gallery
   page uses. The title, alt text and caption are read from there, so a
   caption is only ever written once and the two pages can never disagree.

   TO SWAP A PHOTOGRAPH
   --------------------
   1. Open js/media-data.js and find the `id` of the item you want, for
      example "modular-kitchen-mint-contemporary".
   2. Replace one of the ids in the `items` list below with it.
   3. Save and reload the Home page. That is the whole job.

   NOTES
   -----
   - Videos work here too. Use a video's id and the strip shows its poster
     frame with a small "Film" marker.
   - Keep the list to six. The grid is built for three across on a desktop
     and two on a tablet, so six fills it exactly. Any more are ignored, and
     the section explains itself if there are fewer.
   - An id that does not exist in js/media-data.js is skipped rather than
     breaking the page, and a note is logged in the browser console.
   - Walkthrough, including how to pick six that work: README.md section 3.
*/
window.VRF_FEATURED_WORK = {
  /* Set to false to hide the whole section from the Home page. */
  enabled: true,

  /* Section wording. */
  eyebrow: "FROM OUR OWN PROJECTS",
  heading: "Work we have <em>delivered.</em>",
  intro:
    "Photographed in homes across Gurugram and the NCR after handover. " +
    "Every image here is the studio's own work, not a reference study.",
  linkLabel: "See the full gallery",
  linkHref: "gallery/",

  /* The six items, in the order they should appear.
     Each is an `id` from js/media-data.js. */
  items: [
    "living-room-tv-wall-pooja-unit",
    "modular-kitchen-mint-contemporary",
    "luxury-living-room-cream-sectional",
    "living-room-mirror-feature",
    "modern-bathroom-marble",
    "living-room-warm-brown-contemporary",
  ],
};
