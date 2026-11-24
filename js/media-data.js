/* Gallery media list.
   Each entry needs src, type, title, alt and caption. Videos also need a
   poster: the grid card uses it as the thumbnail, so without one the card
   renders empty. Add real studio work only.

   Files go in media/gallery/photos/ (.webp, long edge ~2000px, under ~400 KB),
   media/gallery/videos/ (.webm VP9) and media/gallery/posters/ (.webp, one per
   film). Name them lower-case-with-hyphens: no spaces, no capitals, no # or &.
   The last line inside each { } has no trailing comma.

   alt is what a blind visitor hears and what Google reads, so describe what is
   actually in the frame. Order here is order on the page. Deleting an image
   file without deleting its entry leaves a broken card.

   Never upload a photograph carrying another designer's watermark.

   The Home page picks six of these by id — see js/featured-work-config.js.
   Walkthrough: README.md section 5.

   Completed VRF HOME INTERIORS work, supplied by the studio. */
const GALLERY_MEDIA = Object.freeze([
    {
      "id": "living-room-tv-wall-pooja-unit",
      "type": "photo",
      "title": "TV wall and pooja unit",
      "src": "media/gallery/photos/living-room-tv-wall-pooja-unit.webp",
      "alt": "Living-room wall combining a fluted black panelled television unit with a white pooja mandir, its arched niches backlit around a carved Om motif.",
      "caption": "One continuous run of joinery holds both the television and the mandir — fluted black panelling, a brass-lit glass display column, then a white pooja unit with backlit arched niches around a carved Om. Built as one wall so neither has to be squeezed into a corner."
    },
    {
      "id": "living-room-modern-white-luxury",
      "type": "photo",
      "title": "White living room with cove ceiling",
      "src": "media/gallery/photos/living-room-modern-white-luxury.webp",
      "alt": "Narrow living room with a grey L-shaped sofa on gold-tipped legs, a triangular cove-lit ceiling, crystal chandelier and a wooden entrance door inlaid with gold lines.",
      "caption": "The triangular cove pulls the eye down a narrow plan, and wall mouldings keep the white envelope from reading flat."
    },
    {
      "id": "master-bedroom-tv-wall",
      "type": "photo",
      "title": "Round television panel, master bedroom",
      "src": "media/gallery/photos/master-bedroom-tv-wall.webp",
      "alt": "Master bedroom with a large circular grey gloss panel holding a wall-mounted television above a floating console with a backlit fluted insert.",
      "caption": "A circle softens a wall of straight lines. The floating console keeps the floor clear and hides the cabling behind the fluted, backlit reveal."
    },
    {
      "id": "master-bedroom-charcoal-panel",
      "type": "photo",
      "title": "Charcoal bed and fluted feature wall",
      "src": "media/gallery/photos/master-bedroom-charcoal-panel.webp",
      "alt": "Bedroom with a charcoal upholstered bed and tall headboard against a cream and black vertical fluted wall with recessed gold LED strips and small display ledges.",
      "caption": "Vertical flutes with gold reveals lift a standard ceiling height, and the ledges give the wall somewhere to put things without a shelf."
    },
    {
      "id": "living-room-warm-brown-contemporary",
      "type": "photo",
      "title": "Warm brown living room",
      "src": "media/gallery/photos/living-room-warm-brown-contemporary.webp",
      "alt": "Living room with a brown suede corner sofa and two ottomans, a glass coffee table, white panel mouldings with gold wall sconces and a twin circular cove-lit ceiling.",
      "caption": "Brown suede corner sofa and ottomans against white panel mouldings and gold wall sconces. Twin circular cove-lit rings overhead separate the seating from the walkway, so one open room reads as two defined zones without needing a partition."
    },
    {
      "id": "modular-kitchen-mint-contemporary",
      "type": "photo",
      "title": "Mint modular kitchen",
      "src": "media/gallery/photos/modular-kitchen-mint-contemporary.webp",
      "alt": "U-shaped modular kitchen in mint green high-gloss with white upper cabinets, reeded amber glass doors in black frames, a white marble backsplash and under-cabinet lighting.",
      "caption": "U-shaped modular kitchen in mint high-gloss, with white uppers, reeded amber glass in black frames and a white marble backsplash. Under-cabinet strips light the counter itself — a ceiling light alone puts the cook's own shadow on the work surface."
    },
    {
      "id": "living-room-mirror-feature",
      "type": "photo",
      "title": "Arched mirror feature wall",
      "src": "media/gallery/photos/living-room-mirror-feature.webp",
      "alt": "Feature wall of tall arched mirror panels outlined in warm LED light, reflecting the living room and its cove-lit circular ceiling.",
      "caption": "A wall of tall arched mirror panels, each outlined in warm LED. In a narrow room the mirrors double the apparent width and carry evening light back across the floor — the job a window would do, in a wall that has none."
    },
    {
      "id": "modern-bathroom-dark",
      "type": "photo",
      "title": "Dark marble shower wall",
      "src": "media/gallery/photos/modern-bathroom-dark.webp",
      "alt": "Bathroom with a dramatic black patterned marble shower wall and rain shower, grey marble to the remaining walls, a lit niche, wall-hung WC and a textured bronze vanity with a white vessel basin.",
      "caption": "One wall of heavily figured black marble does all the work; everything else stays quiet grey so the pattern is not fighting anything."
    },
    {
      "id": "modern-bedroom-wardrobe",
      "type": "photo",
      "title": "Mauve and white sliding wardrobe",
      "src": "media/gallery/photos/modern-bedroom-wardrobe.webp",
      "alt": "Bedroom wardrobe with white gloss sliding doors carrying mauve arch motifs, mauve gloss loft units above with brass knobs, beside a botanical wallpaper panel and a herringbone wooden door.",
      "caption": "Sliding doors were chosen so nothing swings into a tight room, and the arch motif ties the wardrobe to the botanical panel next to it."
    },
    {
      "id": "modern-bathroom-marble",
      "type": "photo",
      "title": "Marble bathroom with gold mirror",
      "src": "media/gallery/photos/modern-bathroom-marble.webp",
      "alt": "Bathroom in white Statuario marble with a black and gold marble WC wall, wall-hung WC, textured bronze vanity with a white vessel basin and a large round gold-framed backlit mirror.",
      "caption": "White Statuario throughout, with a black-and-gold marble return behind the wall-hung WC. Textured bronze vanity, white vessel basin, and a round gold-framed mirror that is backlit, so the veining still reads once the ceiling lights are off."
    },
    {
      "id": "modern-living-room",
      "type": "photo",
      "title": "Entrance and display column",
      "src": "media/gallery/photos/modern-living-room.webp",
      "alt": "Newly completed living room with a white marble accent wall, a black-framed backlit glass display column, a low white television console, a linear black wall light and a teak and grey entrance door.",
      "caption": "Photographed on handover. The lit display column gives the entrance a focal point the moment the door opens."
    },
    {
      "id": "luxury-grey-marble-bathroom",
      "type": "photo",
      "title": "Compact grey marble bathroom",
      "src": "media/gallery/photos/luxury-grey-marble-bathroom.webp",
      "alt": "Compact bathroom in warm grey marble with a beige gloss mirror cabinet over an LED shelf, a rectangular backlit mirror, a white countertop basin on a beige vanity and a linear shower drain.",
      "caption": "A small footprint handled with a mirror cabinet instead of an open shelf, and a linear drain so the floor reads as one uninterrupted plane."
    },
    {
      "id": "modern-home-study-nook",
      "type": "photo",
      "title": "Study nook in blush",
      "src": "media/gallery/photos/modern-home-study-nook.webp",
      "alt": "Home study nook with a blush pink gloss desk, warm-lit open shelving behind reeded black glass, a white fluted wall panel and a pink leather chair.",
      "caption": "A working desk fitted into a bedroom corner, with reeded glass hiding the clutter on the shelves while still letting the light through."
    },
    {
      "id": "luxury-modern-bathroom-grey-marble",
      "type": "photo",
      "title": "Teal vanity bathroom",
      "src": "media/gallery/photos/luxury-modern-bathroom-grey-marble.webp",
      "alt": "Grey marble bathroom with a teal gloss vanity and matching wall cabinet, a white vessel basin, a square backlit mirror, a wall-hung WC and a teal-framed rain shower head.",
      "caption": "Teal gloss lifts a grey marble box, and the wall cabinet keeps everything off the counter."
    },
    {
      "id": "luxury-modern-bedroom-feature-wall",
      "type": "photo",
      "title": "Gold ring chandelier bedroom",
      "src": "media/gallery/photos/luxury-modern-bedroom-feature-wall.webp",
      "alt": "Bedroom with a gold ring LED chandelier set in a circular ceiling cove, a beige fluted curved headboard wall with an oval backlit mirror, and a wood-panelled television wall with a blush console.",
      "caption": "The curved fluted headboard and the circular cove answer each other, so the room turns around the bed rather than the television."
    },
    {
      "id": "luxury-modern-bedroom-interior",
      "type": "photo",
      "title": "Tufted headboard bedroom",
      "src": "media/gallery/photos/luxury-modern-bedroom-interior.webp",
      "alt": "Bedroom with a beige tufted upholstered bed and tall padded headboard, a curved cove ceiling with moulding, an oval backlit mirror and thin gold LED lines on the wall.",
      "caption": "Padded upholstery to the full height of the headboard wall, with thin gold lines drawn across it to break up the mass."
    },
    {
      "id": "luxury-contemporary-interior-hallway",
      "type": "photo",
      "title": "Hallway with pooja unit",
      "src": "media/gallery/photos/luxury-contemporary-interior-hallway.webp",
      "alt": "Hallway in Statuario marble with a white arched mirror screen, teak display shelving and a white pooja unit whose rows of arched niches are individually lit, opening towards the kitchen and bedroom.",
      "caption": "The circulation route doubles as the pooja space, with every niche lit individually so the wall works as much at night as by day."
    },
    {
      "id": "luxury-living-room-cream-sectional",
      "type": "photo",
      "title": "Cream sectional and disc chandelier",
      "src": "media/gallery/photos/luxury-living-room-cream-sectional.webp",
      "alt": "Living room with a cream sectional sofa piped in gold, still part-wrapped after delivery, under a large glass-disc and crystal chandelier, with white wall mouldings and patterned grey curtains.",
      "caption": "Living room at handover: cream sectional piped in gold, white wall mouldings, patterned drapes, and a glass-disc and crystal chandelier scaled to the seating beneath it. Photographed on delivery day, before the wrapping came off the sofa."
    },
    {
      "id": "luxury-modern-open-plan-kitchen",
      "type": "photo",
      "title": "Open-plan teal kitchen",
      "src": "media/gallery/photos/luxury-modern-open-plan-kitchen.webp",
      "alt": "Open-plan view of a teal gloss kitchen with a dark fluted peninsula, black chimney, pendant lights, reeded glass upper cabinets and open shelving, beside a white pooja unit of individually lit arched niches under a crystal chandelier.",
      "caption": "Kitchen, pooja unit and living space in one continuous view, held together by teal gloss against warm beige marble."
    },
    {
      "id": "modern-bedroom-wardrobe-interior",
      "type": "photo",
      "title": "Full-height sliding wardrobe",
      "src": "media/gallery/photos/modern-bedroom-wardrobe-interior.webp",
      "alt": "Empty bedroom with a full-height ivory gloss sliding wardrobe and loft units, a wooden door with a fluted panel, champagne curtains and linear LED strips in the ceiling.",
      "caption": "Wardrobe and lofts taken to the ceiling so no dead space is left on top, photographed before the room was furnished."
    },
    {
      "id": "modern-luxury-marble-living-room",
      "type": "video",
      "title": "Living room with moulded feature wall",
      "src": "media/gallery/videos/modern-luxury-marble-living-room.webm",
      "poster": "media/gallery/posters/modern-luxury-marble-living-room.webp",
      "alt": "Walkthrough of a living room with a brown fabric sectional, a white moulded feature wall carrying metal wall art and crystal sconces, circular cove detailing in the ceiling, a walnut door and an arched white screen dividing the space.",
      "caption": "Circular coves in the ceiling sit above a moulded feature wall, and an arched white screen separates the seating from the passage without closing it off."
    },
    {
      "id": "luxury-marble-pooja-cabinet-with-bell-display",
      "type": "video",
      "title": "Marble pooja unit with bell display",
      "src": "media/gallery/videos/luxury-marble-pooja-cabinet-with-bell-display.webm",
      "poster": "media/gallery/posters/luxury-marble-pooja-cabinet-with-bell-display.webp",
      "alt": "Walkthrough of a pooja unit clad in white and gold veined marble, with a backlit grid of thirty recessed niches each holding a small brass bell, fluted gold-tinted glass doors and a walnut door alongside.",
      "caption": "Thirty individually lit niches, each holding a brass bell, make up the back of this pooja unit. Fluted gold glass doors close it away, and the marble cladding carries the living-room floor up the wall."
    },
    {
      "id": "modern-beige-bedroom-illuminated-arch-wall",
      "type": "video",
      "title": "Bedroom with a curved backlit headboard wall",
      "src": "media/gallery/videos/modern-beige-bedroom-illuminated-arch-wall.webm",
      "poster": "media/gallery/posters/modern-beige-bedroom-illuminated-arch-wall.webp",
      "alt": "Walkthrough of a beige bedroom showing a fluted wall panel cut to a wave and lit from behind with warm LED, a channel-tufted upholstered headboard, a circular ceiling light and a blush console beneath a wall-mounted television.",
      "caption": "The headboard wall is fluted panelling cut to a wave and washed from behind with warm LED, so the curve reads as light rather than as an edge."
    },
    {
      "id": "modern-wooden-wardrobe-illuminated-dressing-mirror",
      "type": "video",
      "title": "Bedroom with an arched dressing mirror",
      "src": "media/gallery/videos/modern-wooden-wardrobe-illuminated-dressing-mirror.webm",
      "poster": "media/gallery/posters/modern-wooden-wardrobe-illuminated-dressing-mirror.webp",
      "alt": "Walkthrough of a bedroom with a cream and walnut panelled headboard wall inset with bronze mirror strips, a charcoal upholstered bed, a grey circular television panel above a floating console, and a walnut dresser under an arch-topped mirror lit around its edge.",
      "caption": "The headboard wall alternates cream panels, walnut and bronze mirror strips. Round the corner an arch-topped mirror, lit around its edge, sits over a walnut dresser."
    },
    {
      "id": "modern-wooden-door-interior",
      "type": "video",
      "title": "Blush wardrobe with backlit niches",
      "src": "media/gallery/videos/modern-wooden-door-interior.webm",
      "poster": "media/gallery/posters/modern-wooden-door-interior.webp",
      "alt": "Walkthrough of a bedroom with a glossy blush-pink sliding wardrobe, a column of backlit vertical niches, a matching dresser in fluted panelling, and a walnut door and frame opening to the rest of the flat.",
      "caption": "A glossy blush wardrobe runs the length of the wall, with lit niches stacked beside a matching dresser. Walnut doors and frames carry the scheme through the rest of the flat."
    },
    {
      "id": "black-gold-marble-bathroom",
      "type": "video",
      "title": "Blue and gold marble bathroom",
      "src": "media/gallery/videos/black-gold-marble-bathroom.webm",
      "poster": "media/gallery/posters/black-gold-marble-bathroom.webp",
      "alt": "Walkthrough of a bathroom lined in white marble with a blue-black and gold veined marble shower wall, a ceiling rain shower, a gold ring accent and shelf, a wall-hung WC, and a dark stone vanity with a vessel basin under a backlit round mirror.",
      "caption": "One slab of blue-and-gold veined marble carries the shower wall against white marble elsewhere. Light hidden under the vanity and behind the round mirror keeps the stone readable after dark."
    },
    {
      "id": "modern-marble-bathroom",
      "type": "video",
      "title": "Grey marble bathroom with teal joinery",
      "src": "media/gallery/videos/modern-marble-bathroom.webm",
      "poster": "media/gallery/posters/modern-marble-bathroom.webp",
      "alt": "Walkthrough of a bathroom lined in grey marble with glossy teal wall cabinets and vanity, a wall-hung WC, a counter-top basin and a gold-framed mirror lit around its edge.",
      "caption": "Grey marble on every surface, warmed by glossy teal cabinetry and a gold-framed backlit mirror. Storage runs above the WC so a compact room uses its full height."
    },
    {
      "id": "modern-elegant-bedroom-interior",
      "type": "video",
      "title": "Bedroom joinery and cove lighting",
      "src": "media/gallery/videos/modern-elegant-bedroom-interior.webm",
      "poster": "media/gallery/posters/modern-elegant-bedroom-interior.webp",
      "alt": "Walkthrough of a bedroom finished in white with simple wall moulding, a full-height sliding wardrobe, walnut doors, linear cove lighting set into the ceiling and floor-length curtains.",
      "caption": "A quieter room: moulded walls, a full-height sliding wardrobe and linear cove lighting set into the ceiling. Filmed at handover, before the room was furnished."
    }
  ]);
