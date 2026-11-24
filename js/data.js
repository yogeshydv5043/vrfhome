/* Central content. Keep reference:true until each project is replaced with authorized, verified studio work. */
const SERVICES = Object.freeze([
  {
    id: "residential",
    title: "Residential Interior Design",
    category: "Residential",
    tagline: "A home that feels unmistakably yours.",
    shortDescription:
      "From the first layout to the final layer, shape a home around the way you live—not the other way around.",
    description:
      "A home is a collection of daily rituals. We begin by understanding how each room is used, where belongings need to live and how the family moves through the day. Layouts, lighting, furniture and finishes are then developed as one connected design, with room for personal pieces rather than a prescribed showroom look.",
    image: "media/home/living-1800.webp",
    alt: "Sunlit living room with caramel leather sofa, natural wood and sculptural lounge chairs",
    offers: [
      "Room-by-room brief and space planning",
      "Furniture layouts and custom joinery concepts",
      "Lighting, finish and textile schedules",
      "Final-layer styling direction",
    ],
    benefits: [
      "A coherent look from room to room",
      "Storage and layouts shaped around daily routines",
      "A clear design direction for coordinated decisions",
    ],
    suitableFor:
      "Homes, apartments, villas and individual residential interiors.",
    cta: "Discuss Your Project",
  },
  {
    id: "commercial",
    title: "Commercial Interior Design",
    category: "Commercial",
    tagline: "Make space for your brand.",
    shortDescription:
      "Create environments that express a clear identity while making everyday operations intuitive.",
    description:
      "A commercial space needs to communicate a brand and work reliably for the people who use it. The design starts with the visitor journey, operational needs and the relationship between public and private areas. Material and lighting choices follow a coherent direction, with durability, maintenance and adaptable use in mind.",
    image: "media/shared/workspace-1800.webp",
    alt: "Open-plan workplace with large windows and modern furnishings",
    offers: [
      "Brand and user-experience brief",
      "Public, staff and support-area planning",
      "Furniture and finish specifications",
      "Lighting and signage coordination concepts",
    ],
    benefits: [
      "A legible, brand-aligned visitor experience",
      "Practical circulation and functional zoning",
      "Material choices informed by intended use",
    ],
    suitableFor:
      "Retail environments, hospitality concepts and customer-facing business spaces.",
    cta: "Discuss Your Project",
  },
  {
    id: "kitchen",
    title: "Modular Kitchen Design",
    category: "Kitchen",
    tagline: "Made for more than cooking.",
    shortDescription:
      "Balance smart storage, practical workflows and beautifully considered finishes in the heart of your home.",
    description:
      "The best kitchen layouts make everyday tasks feel effortless. We consider preparation, cooking, cleaning and storage together before developing cabinetry proportions and finishes. Appliance positions, task lighting and practical surfaces are coordinated into a clear design direction; specialist services and installation requirements are confirmed with qualified providers.",
    image: "media/shared/kitchen-1800.webp",
    alt: "Bright kitchen with white cabinetry and warm timber details",
    offers: [
      "Preparation, cooking and cleaning zones",
      "Cabinetry, drawer and storage concepts",
      "Worktop, backsplash and hardware selections",
      "Appliance and task-lighting coordination",
    ],
    benefits: [
      "An intuitive preparation and cooking workflow",
      "Storage planned around real kitchen habits",
      "A cohesive balance of utility and character",
    ],
    suitableFor: "New kitchens, apartment kitchens and kitchen renovations.",
    cta: "Discuss Your Project",
  },
  {
    id: "living-room",
    title: "Living Room Design",
    category: "Living Room",
    tagline: "Comfort, beautifully composed.",
    shortDescription:
      "Bring seating, light and texture into balance for a room that welcomes conversation and quiet moments.",
    description:
      "A living room should make gathering easy while leaving space to unwind. We explore seating proportions, focal points and circulation before building a palette of furniture, textiles and light. Existing pieces can be woven into the concept so the result feels familiar, layered and personal rather than entirely new for its own sake.",
    image: "media/shared/dining-1800.webp",
    alt: "Neutral living room with an L-shaped sofa, timber coffee table and woven accents",
    offers: [
      "Seating, circulation and focal-point planning",
      "Furniture and rug proportions",
      "Curtains, upholstery and colour direction",
      "Ambient lighting and accessories",
    ],
    benefits: [
      "Comfortable seating and clear movement",
      "A layered palette with a personal character",
      "Lighting that supports different times of day",
    ],
    suitableFor: "Living rooms, lounges and shared family spaces.",
    cta: "Discuss Your Project",
  },
  {
    id: "bedroom",
    title: "Bedroom Design",
    category: "Bedroom",
    tagline: "A softer end to the day.",
    shortDescription:
      "Explore restful palettes and personal details that make your most private space feel deeply comfortable.",
    description:
      "Bedroom design begins with rest, privacy and the small routines at the start and end of each day. The plan considers bed placement, wardrobe access and useful bedside details. Calm colours, soft textures and layers of light create atmosphere, while storage and circulation remain integral to the layout.",
    image: "media/shared/bedroom-1800.webp",
    alt: "Warm timber bedroom with layered bedding, soft lighting and a garden-facing window",
    offers: [
      "Bed, wardrobe and dressing-area layouts",
      "Bedside lighting and storage concepts",
      "Textiles, finishes and restful palettes",
      "Personal accents and styling",
    ],
    benefits: [
      "A calmer, more personal retreat",
      "Useful storage without crowding the room",
      "Lighting that balances rest and everyday tasks",
    ],
    suitableFor: "Primary bedrooms, guest rooms and personal sleeping spaces.",
    cta: "Discuss Your Project",
  },
  {
    id: "office",
    title: "Office Interior Design",
    category: "Office",
    tagline: "Room for your best work.",
    shortDescription:
      "Plan workplaces around focus, collaboration and the practical needs of your team.",
    description:
      "Workplaces need a thoughtful balance of concentration, conversation and movement. We study how the team works and translate that brief into zones for individual tasks, meetings and shared activities. Furniture layouts, lighting and acoustic considerations form a coordinated concept that can evolve with the organization.",
    image: "media/shared/office-1800.webp",
    alt: "Glass-partitioned office lounge with a gray sofa and tall windows",
    offers: [
      "Workstation and meeting-room layouts",
      "Focus and collaboration zones",
      "Furniture and storage direction",
      "Lighting and acoustic design considerations",
    ],
    benefits: [
      "Clearer zones for different modes of work",
      "Layouts that encourage comfortable movement",
      "An adaptable foundation for future needs",
    ],
    suitableFor:
      "Studios, private offices, shared workspaces and workplace refurbishments.",
    cta: "Discuss Your Project",
  },
  {
    id: "space-planning",
    title: "Space Planning",
    category: "Planning",
    tagline: "Better living starts with a plan.",
    shortDescription:
      "Reconsider movement, proportions and connections to make every part of your space work harder.",
    description:
      "Before choosing a finish or a piece of furniture, the space needs a clear plan. We review existing dimensions, door swings, sightlines and circulation to identify how the layout could work better. Alternative arrangements make trade-offs visible and provide a practical foundation for the next design stage.",
    image: "media/shared/calm-1800.webp",
    alt: "Contemporary dining space with concrete walls, timber screening and garden views",
    offers: [
      "Existing-plan and circulation review",
      "Room zoning and furniture test fits",
      "Alternative layout options",
      "A coordinated preferred floor plan",
    ],
    benefits: [
      "Better use of the available footprint",
      "Visible layout options before detailed decisions",
      "More deliberate connections between rooms",
    ],
    suitableFor:
      "New interiors, compact homes and spaces with awkward circulation.",
    cta: "Discuss Your Project",
  },
  {
    id: "renovation",
    title: "Renovation & Styling",
    category: "Renovation",
    tagline: "A fresh perspective on the familiar.",
    shortDescription:
      "Bring new character to an existing space, from focused updates to a cohesive interior refresh.",
    description:
      "Not every transformation needs a complete rebuild. We assess what is worth keeping and where targeted changes could have the greatest effect. A coordinated approach to finishes, furniture and accessories helps an existing space feel renewed while keeping the agreed scope, practical constraints and reuse opportunities in view.",
    image: "media/shared/detail-1800.webp",
    alt: "Airy living room with a timber stair screen, neutral seating and a natural-wood coffee table",
    offers: [
      "Existing-space assessment",
      "Retain, repair and replace strategy",
      "Furniture and finish refresh concepts",
      "Accessories and finishing touches",
    ],
    benefits: [
      "A cohesive refresh without unnecessary replacement",
      "A focused plan for the most meaningful changes",
      "A clearer relationship between old and new",
    ],
    suitableFor:
      "Lived-in homes, individual rooms and spaces ready for a considered refresh.",
    cta: "Discuss Your Project",
  },
]);
const PROJECTS = Object.freeze([
  {
    title: "The Quiet Residence",
    category: "Residential",
    alt: "Sunlit living room with caramel leather sofa, natural wood and sculptural lounge chairs",
    style: "Warm contemporary",
    description:
      "An exploration of natural light, warm wood and everyday comfort. The palette allows tactile materials and personal objects to take centre stage.",
    id: "project-0",
    location: "Sector 56, Gurugram",
    year: "2024",
    area: "2,150 sq ft",
    images: ["media/home/living-1800.webp"],
    page: "projects/the-quiet-residence/",
    reference: true,
    brief:
      "A reference-led exploration of residential interiors, centred on warm contemporary character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "An exploration of natural light, warm wood and everyday comfort. The palette allows tactile materials and personal objects to take centre stage. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Warm oak",
        color: "#b49a75",
      },
      {
        name: "Chalk",
        color: "#e6dfd3",
      },
      {
        name: "Charcoal",
        color: "#424740",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/home/living-1800.webp",
        alt: "Sunlit living room with caramel leather sofa, natural wood and sculptural lounge chairs",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/shared/calm-1800.webp",
        alt: "Contemporary dining space with concrete walls, timber screening and garden views",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
  {
    title: "A Study in Balance",
    category: "Residential",
    alt: "Contemporary dining space with concrete walls, timber screening and garden views",
    style: "Contemporary minimal",
    description:
      "Clean sightlines and restrained materials create a dialogue between interior spaces and the landscape beyond.",
    id: "project-1",
    location: "Sector 42, Gurugram",
    year: "2025",
    area: "2,800 sq ft",
    images: ["media/shared/calm-1800.webp"],
    page: "projects/a-study-in-balance/",
    reference: true,
    brief:
      "A reference-led exploration of residential interiors, centred on contemporary minimal character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "Clean sightlines and restrained materials create a dialogue between interior spaces and the landscape beyond. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Concrete",
        color: "#a7a69e",
      },
      {
        name: "Natural oak",
        color: "#ab835c",
      },
      {
        name: "Deep ink",
        color: "#30383b",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/shared/calm-1800.webp",
        alt: "Contemporary dining space with concrete walls, timber screening and garden views",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/shared/kitchen-1800.webp",
        alt: "Bright kitchen with white cabinetry and warm timber details",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
  {
    title: "The Gathering Kitchen",
    category: "Kitchen",
    alt: "Bright kitchen with white cabinetry and warm timber details",
    style: "Warm minimal",
    description:
      "A considered kitchen concept that brings preparation, storage and conversation together.",
    id: "project-2",
    location: "Sector 93, Gurugram",
    year: "2025",
    area: "450 sq ft",
    images: ["media/shared/kitchen-1800.webp"],
    page: "projects/the-gathering-kitchen/",
    reference: true,
    brief:
      "A reference-led exploration of kitchen interiors, centred on warm minimal character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "A considered kitchen concept that brings preparation, storage and conversation together. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Porcelain",
        color: "#eee9df",
      },
      {
        name: "Warm timber",
        color: "#bb805b",
      },
      {
        name: "Brushed metal",
        color: "#a8a8a3",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/shared/kitchen-1800.webp",
        alt: "Bright kitchen with white cabinetry and warm timber details",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/shared/bedroom-1800.webp",
        alt: "Warm timber bedroom with layered bedding, soft lighting and a garden-facing window",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
  {
    title: "A Softer Sanctuary",
    category: "Bedroom",
    alt: "Warm timber bedroom with layered bedding, soft lighting and a garden-facing window",
    style: "Soft contemporary",
    description:
      "Warm wood, softly layered bedding and a garden-facing window create an inviting place to pause.",
    id: "project-3",
    location: "Sector 29, Gurugram",
    year: "2024",
    area: "520 sq ft",
    images: ["media/shared/bedroom-1800.webp"],
    page: "projects/a-softer-sanctuary/",
    reference: true,
    brief:
      "A reference-led exploration of bedroom interiors, centred on soft contemporary character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "Warm wood, softly layered bedding and a garden-facing window create an inviting place to pause. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Walnut",
        color: "#866044",
      },
      {
        name: "Soft linen",
        color: "#d9c6ad",
      },
      {
        name: "Forest",
        color: "#264d45",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/shared/bedroom-1800.webp",
        alt: "Warm timber bedroom with layered bedding, soft lighting and a garden-facing window",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/shared/dining-1800.webp",
        alt: "Neutral living room with an L-shaped sofa, timber coffee table and woven accents",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
  {
    title: "Room to Connect",
    category: "Living Room",
    alt: "Neutral living room with an L-shaped sofa, timber coffee table and woven accents",
    style: "Organic modern",
    description:
      "An inspiration study in sculptural furniture, warm surfaces and spaces made for gathering.",
    id: "project-4",
    location: "Sector 106, Gurugram",
    year: "2025",
    area: "1,650 sq ft",
    images: ["media/shared/dining-1800.webp"],
    page: "projects/room-to-connect/",
    reference: true,
    brief:
      "A reference-led exploration of living room interiors, centred on organic modern character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "An inspiration study in sculptural furniture, warm surfaces and spaces made for gathering. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Soft ivory",
        color: "#e8e2d7",
      },
      {
        name: "Sand",
        color: "#c6b69e",
      },
      {
        name: "Ash",
        color: "#909288",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/shared/dining-1800.webp",
        alt: "Neutral living room with an L-shaped sofa, timber coffee table and woven accents",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/shared/office-1800.webp",
        alt: "Glass-partitioned office lounge with a gray sofa and tall windows",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
  {
    title: "The Open Workspace",
    category: "Office",
    alt: "Glass-partitioned office lounge with a gray sofa and tall windows",
    style: "Contemporary workplace",
    description:
      "Daylight, glass partitions and shared seating inform a clear, comfortable workplace concept.",
    id: "project-5",
    location: "Sector 18, Gurugram",
    year: "2024",
    area: "3,400 sq ft",
    images: ["media/shared/office-1800.webp"],
    page: "projects/the-open-workspace/",
    reference: true,
    brief:
      "A reference-led exploration of office interiors, centred on contemporary workplace character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "Daylight, glass partitions and shared seating inform a clear, comfortable workplace concept. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Glass grey",
        color: "#afbcc2",
      },
      {
        name: "Midnight",
        color: "#283b4a",
      },
      {
        name: "Soft white",
        color: "#e8e6e0",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/shared/office-1800.webp",
        alt: "Glass-partitioned office lounge with a gray sofa and tall windows",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/shared/detail-1800.webp",
        alt: "Airy living room with a timber stair screen, neutral seating and a natural-wood coffee table",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
  {
    title: "Material Matters",
    category: "Residential",
    alt: "Airy living room with a timber stair screen, neutral seating and a natural-wood coffee table",
    style: "Natural contemporary",
    description:
      "A study of the quiet character of timber and textiles, with simple forms and a tactile palette.",
    id: "project-6",
    location: "Sector 54, Gurugram",
    year: "2026",
    area: "1,950 sq ft",
    images: ["media/shared/detail-1800.webp"],
    page: "projects/material-matters/",
    reference: true,
    brief:
      "A reference-led exploration of residential interiors, centred on natural contemporary character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "A study of the quiet character of timber and textiles, with simple forms and a tactile palette. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Pale oak",
        color: "#b89d7e",
      },
      {
        name: "Linen",
        color: "#e4dccb",
      },
      {
        name: "Slate",
        color: "#556275",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/shared/detail-1800.webp",
        alt: "Airy living room with a timber stair screen, neutral seating and a natural-wood coffee table",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/shared/lounge-1800.webp",
        alt: "Quiet living space with natural textures and softly layered furnishings",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
  {
    title: "The Everyday Retreat",
    category: "Living Room",
    alt: "Quiet living space with natural textures and softly layered furnishings",
    style: "Timeless neutral",
    description:
      "Comfortable proportions and carefully layered materials make an everyday corner feel special.",
    id: "project-7",
    location: "Sector 87, Gurugram",
    year: "2025",
    area: "1,400 sq ft",
    images: ["media/shared/lounge-1800.webp"],
    page: "projects/the-everyday-retreat/",
    reference: true,
    brief:
      "A reference-led exploration of living room interiors, centred on timeless neutral character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "Comfortable proportions and carefully layered materials make an everyday corner feel special. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Chalk",
        color: "#e7e3d7",
      },
      {
        name: "Warm oak",
        color: "#b29872",
      },
      {
        name: "Leaf",
        color: "#657b55",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/shared/lounge-1800.webp",
        alt: "Quiet living space with natural textures and softly layered furnishings",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/shared/workspace-1800.webp",
        alt: "Open-plan workplace with large windows and modern furnishings",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
  {
    title: "Space for Ideas",
    category: "Commercial",
    alt: "Open-plan workplace with large windows and modern furnishings",
    style: "Contemporary",
    description:
      "An open commercial interior study that balances circulation, shared space and visual clarity.",
    id: "project-8",
    location: "Sector 48, Gurugram",
    year: "2026",
    area: "4,200 sq ft",
    images: ["media/shared/workspace-1800.webp"],
    page: "projects/space-for-ideas/",
    reference: true,
    brief:
      "A reference-led exploration of commercial interiors, centred on contemporary character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "An open commercial interior study that balances circulation, shared space and visual clarity. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Warm concrete",
        color: "#989486",
      },
      {
        name: "Brick red",
        color: "#9c6558",
      },
      {
        name: "Ink",
        color: "#303d42",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/shared/workspace-1800.webp",
        alt: "Open-plan workplace with large windows and modern furnishings",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/shared/kitchen2-1800.webp",
        alt: "Light-filled living room opening to a white kitchen, with a timber feature wall and pendant lights",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
  {
    title: "The Light House",
    category: "Kitchen",
    alt: "Light-filled living room opening to a white kitchen, with a timber feature wall and pendant lights",
    style: "Modern natural",
    description:
      "A light-filled kitchen and living concept that celebrates openness, natural finishes and generous gathering spaces.",
    id: "project-9",
    location: "Sector 84, Gurugram",
    year: "2025",
    area: "2,600 sq ft",
    images: ["media/shared/kitchen2-1800.webp"],
    page: "projects/the-light-house/",
    reference: true,
    brief:
      "A reference-led exploration of kitchen interiors, centred on modern natural character. This study considers how proportion, light and tactile detail can shape a more personal space.",
    concept:
      "A light-filled kitchen and living concept that celebrates openness, natural finishes and generous gathering spaces. The intention is to keep the composition coherent: a clear focal point, comfortable movement and layers that support everyday use.",
    considerations: [
      "Consider the relationship between natural light and room layout.",
      "Balance functional circulation with comfortable furniture proportions.",
      "Use a restrained material direction to connect the individual elements.",
    ],
    materials: [
      {
        name: "Honey oak",
        color: "#b89367",
      },
      {
        name: "Cloud",
        color: "#e4e4df",
      },
      {
        name: "Stone",
        color: "#a2a29c",
      },
    ],
    comparison: {
      verified: false,
      before: "",
      after: "",
      beforeAlt: "",
      afterAlt: "",
      caption: "",
    },
    gallery: [
      {
        src: "media/shared/kitchen2-1800.webp",
        alt: "Light-filled living room opening to a white kitchen, with a timber feature wall and pendant lights",
        caption: "Primary reference photograph.",
      },
      {
        src: "media/home/living-1800.webp",
        alt: "Sunlit living room with caramel leather sofa, natural wood and sculptural lounge chairs",
        caption:
          "Related material and spatial reference — not the same commission.",
      },
    ],
  },
]);
const NAVIGATION = Object.freeze([
  {
    href: "",
    label: "Home",
  },
  {
    href: "about/",
    label: "About",
  },
  {
    href: "service/",
    label: "Services",
  },
  {
    href: "projects/",
    label: "Projects",
  },
  {
    href: "gallery/",
    label: "Gallery",
  },
  {
    href: "contact-us/",
    label: "Contact",
  },
]);
const PAGE_META = Object.freeze({
  "": {
    title: "Considered Spaces. Extraordinary Living.",
    description:
      "Considered spaces, extraordinary living. Explore a thoughtful approach to residential and commercial interior design, materials and personal spaces.",
    image: "media/home/living-1800.webp",
    imageAlt:
      "Sunlit living room with caramel leather sofa, natural wood and sculptural lounge chairs",
  },
  "about/": {
    title: "About the Studio",
    description:
      "Meet Ritesh Kumar and the VRF Home Interiors team. A Gurugram studio designing interiors around how each family actually lives, since 2020.",
    image: "media/shared/calm-1800.webp",
    imageAlt:
      "Contemporary dining space with concrete walls, timber screening and garden views",
  },
  "service/": {
    title: "Interior Design Services",
    description:
      "Residential and commercial interior design, modular kitchens, bedrooms, offices, space planning and renovation across Gurugram and the NCR. Book a visit.",
    image: "media/shared/detail-1800.webp",
    imageAlt:
      "Airy living room with a timber stair screen, neutral seating and a natural-wood coffee table",
  },
  "projects/": {
    title: "Projects & Reference Concepts",
    description:
      "Browse interior design concepts for homes, kitchens, bedrooms, living rooms and workplaces. Filter by space type to find a direction for your project.",
    image: "media/shared/kitchen2-1800.webp",
    imageAlt:
      "Light-filled living room opening to a white kitchen, with a timber feature wall and pendant lights",
  },
  "gallery/": {
    title: "Photo & Video Gallery",
    description: "Photographs and video walkthroughs of interiors by VRF Home Interiors, Sector 93, Gurugram. See finishes, joinery and detailing up close.",
    image: "media/home/living-1800.webp",
    imageAlt: "Sunlit interior reference with natural materials",
  },
  "contact-us/": {
    title: "Start Your Project",
    description:
      "Call +91 99990 88992 or send an enquiry. Visit our Sector 93 studio in Gurugram, Monday to Saturday, 10am to 7pm, to see samples in person.",
    image: "media/shared/lounge-1800.webp",
    imageAlt:
      "Quiet living space with natural textures and softly layered furnishings",
  },
  "privacy-policy/": {
    title: "Privacy Policy",
    description:
      "How VRF Home Interiors collects, uses and protects the information you share through enquiries on this website, and how to request its deletion.",
    image: "media/shared/dining-1800.webp",
    imageAlt:
      "Neutral living room with an L-shaped sofa, timber coffee table and woven accents",
  },
  "terms/": {
    title: "Terms & Conditions",
    description:
      "The terms for using the VRF Home Interiors website, covering permitted use, intellectual property, project information and links to other sites.",
    image: "media/shared/office-1800.webp",
    imageAlt:
      "Glass-partitioned office lounge with a gray sofa and tall windows",
  },
  "disclaimer/": {
    title: "Website Disclaimer",
    description:
      "How reference photography, project concepts, customer ratings and pricing information are presented on the VRF Home Interiors website.",
    image: "media/shared/bedroom-1800.webp",
    imageAlt:
      "Warm timber bedroom with layered bedding, soft lighting and a garden-facing window",
  },
  "projects/the-quiet-residence/": {
    title: "The Quiet Residence — Project Story",
    description:
      "A residential concept built on natural light, warm wood and everyday comfort. See the layout thinking, material palette and reference photography.",
    image: "media/home/living-1800.webp",
    imageAlt:
      "Sunlit living room with caramel leather sofa, natural wood and sculptural lounge chairs",
  },
  "projects/a-study-in-balance/": {
    title: "A Study in Balance — Project Story",
    description:
      "A minimal residential concept where clean sightlines and restrained materials open the interior to the landscape. See the palette and planning.",
    image: "media/shared/calm-1800.webp",
    imageAlt:
      "Contemporary dining space with concrete walls, timber screening and garden views",
  },
  "projects/the-gathering-kitchen/": {
    title: "The Gathering Kitchen — Project Story",
    description:
      "A modular kitchen concept that brings preparation, storage and conversation into one space. See the layout, worktop materials and joinery detail.",
    image: "media/shared/kitchen-1800.webp",
    imageAlt: "Bright kitchen with white cabinetry and warm timber details",
  },
  "projects/a-softer-sanctuary/": {
    title: "A Softer Sanctuary — Project Story",
    description:
      "A bedroom concept in warm wood and layered bedding, planned around a garden-facing window. See the palette, storage thinking and detailing.",
    image: "media/shared/bedroom-1800.webp",
    imageAlt:
      "Warm timber bedroom with layered bedding, soft lighting and a garden-facing window",
  },
  "projects/room-to-connect/": {
    title: "Room to Connect — Project Story",
    description:
      "A living room concept using sculptural furniture and warm surfaces to make a space for gathering. See the seating layout and material direction.",
    image: "media/shared/dining-1800.webp",
    imageAlt:
      "Neutral living room with an L-shaped sofa, timber coffee table and woven accents",
  },
  "projects/the-open-workspace/": {
    title: "The Open Workspace — Project Story",
    description:
      "An office interior concept using daylight, glass partitions and shared seating for focus and collaboration. See the planning and finishes.",
    image: "media/shared/office-1800.webp",
    imageAlt:
      "Glass-partitioned office lounge with a gray sofa and tall windows",
  },
  "projects/material-matters/": {
    title: "Material Matters — Project Story",
    description:
      "A material-led interior concept exploring timber, textiles and simple forms. See how a tactile palette is combined across a residential space.",
    image: "media/shared/detail-1800.webp",
    imageAlt:
      "Airy living room with a timber stair screen, neutral seating and a natural-wood coffee table",
  },
  "projects/the-everyday-retreat/": {
    title: "The Everyday Retreat — Project Story",
    description:
      "A bedroom concept where comfortable proportions and layered materials make an ordinary corner feel considered. See the palette and detailing.",
    image: "media/shared/lounge-1800.webp",
    imageAlt:
      "Quiet living space with natural textures and softly layered furnishings",
  },
  "projects/space-for-ideas/": {
    title: "Space for Ideas — Project Story",
    description:
      "A commercial interior concept balancing circulation, shared space and visual clarity. See the planning approach, materials and reference imagery.",
    image: "media/shared/workspace-1800.webp",
    imageAlt: "Open-plan workplace with large windows and modern furnishings",
  },
  "projects/the-light-house/": {
    title: "The Light House — Project Story",
    description:
      "An open kitchen and living concept celebrating daylight, natural finishes and generous gathering space. See the layout and material direction.",
    image: "media/shared/kitchen2-1800.webp",
    imageAlt:
      "Light-filled living room opening to a white kitchen, with a timber feature wall and pendant lights",
  },
  "consultation/": {
    title: "Discuss Your Interior Project",
    description:
      "Tell us about your space, budget and timeline. Share your interior project requirements with our Gurugram studio and we will plan the next step.",
    image: "media/shared/calm-1800.webp",
    imageAlt:
      "Contemporary dining space with concrete walls, timber screening and garden views",
  },
  "reviews/": {
    title: "Customer Reviews",
    description:
      "Read customer reviews and share your experience with VRF Home Interiors in Gurugram.",
    image: "media/home/living-1800.webp",
    imageAlt: "Considered interior spaces by VRF Home Interiors",
  },
  /* The error page. Its data-route is "404", and without an entry here the
     lookup in content.js falls back to the home page, so a visitor who hits a
     dead link saw "Considered Spaces. Extraordinary Living." in the browser
     tab. The page is noindex, so this is about the tab and shared links. */
  "404": {
    title: "Page Not Found",
    description:
      "That page could not be found. Browse our interior design services, projects and gallery, or contact the VRF Home Interiors studio in Gurugram.",
    image: "media/shared/calm-1800.webp",
    imageAlt:
      "Contemporary dining space with concrete walls, timber screening and garden views",
  },
});
const HOME_PROJECTS = Object.freeze({
  featured: ["project-1", "project-3", "project-2", "project-7"],
  more: [],
});

/* Home reviews are maintained separately in js/reviews-config.js. */
