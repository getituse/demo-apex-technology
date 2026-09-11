import type { TenantContentInput } from "../../config/content-schema";
import { galleryIllustration } from "../../lib/placeholder-media";

const imagesBase = "/tenants/apex-technology/images";
const illustrations = {
  systems: galleryIllustration(imagesBase, 1),
  data: galleryIllustration(imagesBase, 2),
  electronics: galleryIllustration(imagesBase, 3),
  robotics: galleryIllustration(imagesBase, 4),
  energy: galleryIllustration(imagesBase, 5),
  materials: galleryIllustration(imagesBase, 6),
  interaction: galleryIllustration(imagesBase, 7),
  product: galleryIllustration(imagesBase, 8),
  library: galleryIllustration(imagesBase, 9),
  commons: galleryIllustration(imagesBase, 10),
  review: galleryIllustration(imagesBase, 11),
  exhibition: galleryIllustration(imagesBase, 12),
};

/** Editorial catalogue for Apex Institute of Technology. */
export const editorial = {
  news: [
    {
      slug: "reading-a-study-pathway",
      title: "Navigating Engineering Pathways at Apex: Curriculum Structure & Practical Projects",
      excerpt:
        "An in-depth guide to our multidisciplinary curriculum across computing, electronics, sustainable energy, and human-centred design.",
      publishedAt: "2026-09-08",
      category: "Academic Planning",
      image: illustrations.systems,
      body: [
        "At Apex Institute of Technology, our degree pathways are built around an interdisciplinary core that bridges mathematical rigor with hands-on laboratory prototyping. Whether pursuing computing systems, electronic engineering, or sustainable design, every student engages with real-world technical problems from their first term.",
        "Our modular curriculum allows students to develop foundational competencies before specializing in advanced topics such as distributed computing, robotics kinematics, microgrid architecture, or accessible interaction design.",
        "We encourage prospective applicants to review pathway highlights, speak with admissions tutors, and examine the balance of laboratory coursework, group capstones, and independent research embedded in each degree route.",
      ],
      isDemoContent: false,
    },
    {
      slug: "repairable-sensor-project-brief",
      title: "Engineering for Longevity: The Repairable Sensor Project",
      excerpt:
        "Second-year electronics students develop modular environmental sensors engineered for field diagnosis and component-level repair.",
      publishedAt: "2026-09-03",
      category: "Student Projects",
      image: illustrations.electronics,
      body: [
        "In our Department of Electronic and Robotic Systems, undergraduate cohorts recently completed a collaborative project designing modular environmental monitoring devices with field-replaceable parts and clear diagnostic interfaces.",
        "Students balanced electrical efficiency with physical maintainability, documenting schematic diagrams, component tolerances, and step-by-step disassembly workflows using open-standard hardware frameworks.",
        "This project exemplifies Apex's commitment to circular engineering, ensuring our future engineers understand how product lifecycle, repairability, and responsible resource stewardship influence design choices.",
      ],
      isDemoContent: false,
    },
    {
      slug: "data-provenance-notebook",
      title: "Principles of Data Provenance and Auditable Machine Learning Pipelines",
      excerpt:
        "How our computing students build reproducible data architectures that track inputs, transformations, and model provenance.",
      publishedAt: "2026-08-26",
      category: "Computing & AI",
      image: illustrations.data,
      body: [
        "In modern data engineering, reproducibility and verifiable lineage are critical. Apex postgraduate researchers work with complex distributed pipelines where every transformation step is tracked and audited.",
        "Through structured studio exercises, students implement immutable data versioning, lineage tracking, and automated validation tests to guard against data corruption and algorithmic drift in production environments.",
        "These technical practices prepare graduates to lead high-integrity data infrastructure teams across industry, academia, and public sector research bodies.",
      ],
      isDemoContent: false,
    },
    {
      slug: "accessible-interface-critique",
      title: "Accessibility First: Inclusive Interaction Design in Studio Practice",
      excerpt:
        "Why human-centred engineering starts with keyboard navigability, semantic structure, and cognitive accessibility.",
      publishedAt: "2026-08-14",
      category: "Design Practice",
      image: illustrations.interaction,
      body: [
        "In our Human-Centred Technology studios, interaction design begins with universal access requirements rather than purely visual aesthetics. Students evaluate prototypes against WCAG 2.1 Level AA standards before moving to high-fidelity implementation.",
        "Design reviews involve tracing complete task flows using keyboard-only navigation, screen readers, and high-contrast modes, identifying cognitive friction points and ambiguous interaction cues.",
        "By grounding design practice in inclusive principles, our graduates create digital tools, industrial equipment interfaces, and assistive hardware that serve diverse user communities effectively.",
      ],
      isDemoContent: false,
    },
    {
      slug: "career-portfolio-evidence",
      title: "Building an Engineering Portfolio Founded on Technical Evidence and Trade-offs",
      excerpt:
        "Industry advisory panels share what makes engineering graduates stand out: rigorous documentation of decisions and constraints.",
      publishedAt: "2026-07-29",
      category: "Career & Industry",
      image: illustrations.review,
      body: [
        "At our annual Industry Advisory Colloquium, technology engineering leaders emphasized that the most compelling portfolios highlight technical reasoning, failed experiments, and constraint management alongside finished prototypes.",
        "Apex students are guided to maintain comprehensive engineering notebooks that document why specific architectural patterns, materials, or control algorithms were chosen over viable alternatives.",
        "This evidence-led approach enables graduates to articulate trade-offs clearly during technical interviews and transition seamlessly into fast-paced engineering teams.",
      ],
      isDemoContent: false,
    },
    {
      slug: "material-use-design-journal",
      title: "Circular Engineering: Material Selection and Disassembly in Product Design",
      excerpt:
        "Integrating lifecycle analysis, disassembly mapping, and low-embodied carbon materials into sustainable engineering projects.",
      publishedAt: "2026-07-10",
      category: "Sustainable Engineering",
      image: illustrations.materials,
      body: [
        "Sustainable engineering requires evaluating material extraction, manufacturing complexity, and end-of-life recovery before committing to physical production.",
        "In our Materials and Circular Design studio, students conduct comparative lifecycle analyses, contrasting traditional polymer enclosures with bio-composites and recyclable aluminium alloys.",
        "By coupling material science with mechanical design, students develop products that can be disassembled in minutes using standard tools, advancing the principles of the circular economy.",
      ],
      isDemoContent: false,
    },
  ],
  events: [
    {
      slug: "sample-project-notebook-july",
      title: "Engineering Documentation & Systems Workshop",
      category: "Technical Workshop",
      summary:
        "Hands-on workshop on keeping auditable laboratory notebooks, version-controlled hardware schematics, and clean technical documentation.",
      startsAt: "2026-07-16",
      endsAt: "2026-07-16",
      location: "Engineering Commons Hall A",
      image: illustrations.commons,
      body: [
        "This technical workshop provided practical guidance on establishing rigorous documentation standards for complex multi-person engineering projects.",
        "Participants learned to structure technical journals, automate schema verification, and link experimental observations directly to hardware git repositories.",
      ],
      isDemoContent: false,
    },
    {
      slug: "sample-design-critique-august",
      title: "Inclusive Interaction Design Studio Review",
      category: "Design Critique",
      summary:
        "Summer term critique session reviewing prototype interfaces for cognitive accessibility and screen-reader compatibility.",
      startsAt: "2026-08-20",
      endsAt: "2026-08-20",
      location: "Design Studio 2, Main Campus",
      image: illustrations.interaction,
      body: [
        "Faculty tutors and visiting accessibility specialists conducted comprehensive reviews of student interaction models, testing prototypes across assistive technologies.",
        "Critiques focused on clear visual hierarchies, keyboard navigation flows, and resilient error recovery mechanisms.",
      ],
      isDemoContent: false,
    },
    {
      slug: "sample-pathway-exploration-october",
      title: "Autumn Engineering & Technology Open Day",
      category: "Campus Open Day",
      summary:
        "Meet faculty deans, tour advanced fabrication and robotics suites, and attend sample lectures across our degree programmes.",
      startsAt: "2026-10-14",
      endsAt: "2026-10-14",
      location: "Main Auditorium & Engineering Quad",
      image: illustrations.exhibition,
      body: [
        "Our autumn open day welcomes prospective undergraduate and postgraduate students to explore campus facilities, interact with academic staff, and inspect live research demonstrations.",
        "Departmental breakout sessions provide detailed overviews of course structures, laboratory resources, industrial placements, and student support services.",
      ],
      isDemoContent: false,
    },
    {
      slug: "sample-repair-design-november",
      title: "Symposium on Circular Design and Sustainable Hardware",
      category: "Industry Symposium",
      summary:
        "Invited academic researchers and industrial practitioners discuss right-to-repair frameworks and circular materials.",
      startsAt: "2026-11-12",
      endsAt: "2026-11-12",
      location: "Sustainable Engineering Lecture Theatre",
      image: illustrations.robotics,
      body: [
        "This public symposium brings together engineers, material scientists, and policy advocates to address the technical hurdles in designing repairable electronic hardware.",
        "Keynote presentations will be followed by interactive panel discussions and student project demonstrations examining modular consumer electronics.",
      ],
      isDemoContent: false,
    },
    {
      slug: "sample-portfolio-review-december",
      title: "Graduate Engineering Colloquium & Industry Showcase",
      category: "Industry Showcase",
      summary:
        "Final-year students present working hardware prototypes and production software systems to leading technology employers.",
      startsAt: "2026-12-03",
      endsAt: "2026-12-03",
      location: "Apex Innovation Hall",
      image: illustrations.review,
      body: [
        "Our annual Graduate Colloquium provides graduating engineering students an opportunity to showcase their capstone dissertations and working prototypes to partner employers.",
        "Sessions feature interactive hardware demonstrations, algorithmic code reviews, and networking with technology leaders from across the region.",
      ],
      isDemoContent: false,
    },
  ],
  programs: [
    {
      slug: "computer-science-beng",
      name: "Computer Science BEng (Hons)",
      summary:
        "A rigorous four-year programme combining algorithm theory, systems architecture, distributed computing, and software engineering.",
      body: [
        "The Computer Science BEng at Apex Institute of Technology equips students to solve complex computing challenges through mathematical foundations and practical software architecture.",
        "The curriculum spans data structures, compiler design, network protocols, operating systems, and distributed cloud computing. In year three, students undertake an extensive team engineering capstone simulating modern agile product development.",
        "Graduates develop deep fluency in multiple programming paradigms, rigorous software verification, and systems optimization, preparing them for leadership roles in software architecture and technical research.",
      ],
      departmentSlug: "computing",
      levelLabel: "Undergraduate Degree",
      durationLabel: "4 Years Full-Time",
      highlights: [
        "Distributed Systems & Architecture",
        "Algorithm Design & Verification",
        "Collaborative Software Engineering",
      ],
      image: illustrations.systems,
      isDemoContent: false,
    },
    {
      slug: "data-engineering-msc",
      name: "Data Engineering MSc",
      summary:
        "Advanced postgraduate training in scalable data infrastructure, streaming platforms, distributed storage, and data governance.",
      body: [
        "The Data Engineering MSc provides intensive instruction in building and operating robust, high-throughput data architectures capable of handling petabyte-scale data flows.",
        "Students explore stream processing architectures, distributed consensus protocols, data lineage tracking, and automated pipeline orchestration using modern industry-standard frameworks.",
        "The programme culminates in an independent dissertation project partnered with leading research labs or industry organizations tackling pressing data infrastructure challenges.",
      ],
      departmentSlug: "computing",
      levelLabel: "Postgraduate Master's",
      durationLabel: "1 Year Full-Time",
      highlights: [
        "Streaming & Batch Data Pipelines",
        "Data Provenance & Governance",
        "Cloud Distributed Infrastructure",
      ],
      image: illustrations.data,
      isDemoContent: false,
    },
    {
      slug: "electronic-systems-beng",
      name: "Electronic Systems BEng (Hons)",
      summary:
        "Applied engineering covering circuit design, embedded microcontrollers, high-speed signal processing, and hardware diagnostics.",
      body: [
        "The Electronic Systems BEng prepares students to design, prototype, and validate sophisticated electronic hardware spanning microelectronics, embedded firmware, and RF communications.",
        "Students spend substantial time in our electronic fabrication laboratories, utilizing precision oscilloscopes, spectrum analyzers, and PCB routing software to build dependable physical hardware.",
        "The curriculum integrates sustainable hardware principles, emphasizing low-power design, electromagnetic compatibility, and long-term repairability.",
      ],
      departmentSlug: "electronic-and-robotic-systems",
      levelLabel: "Undergraduate Degree",
      durationLabel: "3 Years Full-Time",
      highlights: [
        "Precision Circuit Analysis",
        "Embedded Systems Architecture",
        "Signal Processing & Measurement",
      ],
      image: illustrations.electronics,
      isDemoContent: false,
    },
    {
      slug: "robotics-and-autonomy-meng",
      name: "Robotics and Autonomy MEng (Hons)",
      summary:
        "An integrated master's bridging mechanical dynamics, kinematics, real-time sensor fusion, and autonomous systems control.",
      body: [
        "The Robotics and Autonomy MEng provides an integrated four-year engineering pathway connecting mechanical kinematics, embedded control, and computer vision.",
        "From early robotics simulations to physical rover platforms, students master multi-sensor fusion, state estimation, path planning, and real-time operating systems.",
        "The final year features an advanced individual research thesis alongside collaborative robotics challenges tackling industrial automation, search-and-rescue, and planetary exploration scenarios.",
      ],
      departmentSlug: "electronic-and-robotic-systems",
      levelLabel: "Integrated Master's",
      durationLabel: "4 Years Full-Time",
      highlights: [
        "Kinematics & Multi-Body Dynamics",
        "Sensor Fusion & Computer Vision",
        "Autonomous Control Systems",
      ],
      image: illustrations.robotics,
      isDemoContent: false,
    },
    {
      slug: "sustainable-energy-beng",
      name: "Sustainable Energy BEng (Hons)",
      summary:
        "Engineering foundational clean energy systems, renewable grid integration, thermodynamic balances, and storage technologies.",
      body: [
        "The Sustainable Energy BEng focuses on the urgent technical challenges of the global energy transition: renewable generation, electrical energy storage, and smart grid optimization.",
        "Coursework combines rigorous thermodynamic modelling with practical laboratory investigations into photovoltaic cells, wind turbine aerodynamics, and battery management systems.",
        "Students learn to balance economic, environmental, and regulatory constraints, graduating with the technical skills needed to accelerate the adoption of decarbonised energy systems.",
      ],
      departmentSlug: "sustainable-engineering",
      levelLabel: "Undergraduate Degree",
      durationLabel: "3 Years Full-Time",
      highlights: [
        "Renewable Energy Generation",
        "Grid Balancing & Energy Storage",
        "Thermodynamic Modelling",
      ],
      image: illustrations.energy,
      isDemoContent: false,
    },
    {
      slug: "materials-and-circular-design-msc",
      name: "Materials and Circular Design MSc",
      summary:
        "Postgraduate specialisation in circular lifecycle engineering, sustainable biomaterials, disassembly, and remanufacturing.",
      body: [
        "This master's programme examines the cutting edge of sustainable material science, remanufacturing engineering, and circular industrial systems.",
        "Students conduct advanced material characterisation in our studios, assessing polymer recyclability, bio-composite tensile strength, and modular disassembly mechanics.",
        "Graduates are equipped to lead sustainability initiatives across product manufacturing, aerospace, consumer electronics, and automotive engineering.",
      ],
      departmentSlug: "sustainable-engineering",
      levelLabel: "Postgraduate Master's",
      durationLabel: "1 Year Full-Time",
      highlights: [
        "Circular Economy Principles",
        "Advanced Sustainable Materials",
        "Lifecycle Assessment & Disassembly",
      ],
      image: illustrations.materials,
      isDemoContent: false,
    },
    {
      slug: "interaction-design-bdes",
      name: "Interaction Design BDes (Hons)",
      summary:
        "Human-centred digital product design exploring user research, accessible interfaces, design systems, and rapid prototyping.",
      body: [
        "The Interaction Design BDes bridges design creativity with technological understanding, training designers to build intuitive, accessible, and ethical digital experiences.",
        "Students master user research methodologies, rapid paper and digital prototyping, interaction architecture, and accessibility testing across diverse platforms and form factors.",
        "Studio modules emphasize iterative critique, close collaboration with engineering cohorts, and direct engagement with external communities to validate design solutions.",
      ],
      departmentSlug: "design-and-human-centred-technology",
      levelLabel: "Undergraduate Degree",
      durationLabel: "3 Years Full-Time",
      highlights: [
        "User Research & Task Analysis",
        "Design Systems & Prototyping",
        "Inclusive & Accessible Interaction",
      ],
      image: illustrations.interaction,
      isDemoContent: false,
    },
    {
      slug: "product-design-technology-bsc",
      name: "Product Design Technology BSc (Hons)",
      summary:
        "Bridging engineering precision with industrial aesthetic design, rapid additive manufacturing, and ergonomic testing.",
      body: [
        "The Product Design Technology BSc combines mechanical engineering principles with industrial product design, preparing students to take physical products from concept to manufacture.",
        "Working in our digital prototyping studios, students utilize 3D CAD software, CNC machining, additive 3D printing, and ergonomic analysis tools to develop functional prototypes.",
        "The curriculum places strong emphasis on manufacturing feasibility, design for repair and recycling, and rigorous usability evaluation.",
      ],
      departmentSlug: "design-and-human-centred-technology",
      levelLabel: "Undergraduate Degree",
      durationLabel: "3 Years Full-Time",
      highlights: [
        "CAD Modelling & Prototyping",
        "Ergonomics & Human Factors",
        "Manufacturing & Assembly Analysis",
      ],
      image: illustrations.product,
      isDemoContent: false,
    },
  ],
  departments: [
    {
      slug: "computing",
      name: "Department of Computing",
      summary:
        "Fostering excellence in theoretical computer science, software engineering, machine learning, and cloud infrastructure.",
      body: [
        "The Department of Computing at Apex Institute of Technology is dedicated to rigorous technical education and applied systems research.",
        "Our academic staff guide students through core computer science principles, high-concurrency architectures, and verifiable software design within purpose-built computing laboratories.",
      ],
      leadPersonSlug: "mira-ellis",
      image: illustrations.systems,
      isDemoContent: false,
    },
    {
      slug: "electronic-and-robotic-systems",
      name: "Department of Electronic and Robotic Systems",
      summary:
        "Integrating circuit theory, embedded microelectronics, robotics, and autonomous systems control.",
      body: [
        "The Department of Electronic and Robotic Systems provides advanced laboratory facilities and expert faculty across embedded hardware, signal processing, and robotics.",
        "Through hands-on project work, students gain direct experience with modern measurement instrumentation, embedded microcontrollers, and autonomous robotics platforms.",
      ],
      leadPersonSlug: "theo-rowan",
      image: illustrations.electronics,
      isDemoContent: false,
    },
    {
      slug: "sustainable-engineering",
      name: "Department of Sustainable Engineering",
      summary:
        "Pioneering technological solutions in renewable power systems, circular manufacturing, and ecological materials.",
      body: [
        "The Department of Sustainable Engineering addresses global environmental challenges through technological innovation, lifecycle analysis, and energy systems engineering.",
        "Our teaching and research emphasize measurable efficiency improvements, circular materials, and renewable energy technologies.",
      ],
      leadPersonSlug: "leena-vale",
      image: illustrations.energy,
      isDemoContent: false,
    },
    {
      slug: "design-and-human-centred-technology",
      name: "Department of Design and Human-centred Technology",
      summary:
        "Championing accessible digital interaction, physical product ergonomics, and ethical technology development.",
      body: [
        "The Department of Design and Human-centred Technology unites interaction designers, ergonomists, and engineers to create technology that serves human needs inclusively.",
        "Our studio culture prioritizes universal accessibility, rigorous user testing, and ethical considerations throughout the product lifecycle.",
      ],
      leadPersonSlug: "jules-hart",
      image: illustrations.interaction,
      isDemoContent: false,
    },
  ],
  people: [
    {
      slug: "mira-ellis",
      name: "Mira Ellis",
      role: "Head of Computing & Professor of Systems Architecture",
      departmentSlug: "computing",
      credentials: [],
      bio: [
        "Mira Ellis leads the Department of Computing at Apex Institute of Technology, specializing in distributed systems, reliable software architecture, and runtime verification.",
        "With over fifteen years of academic leadership and collaborative engineering experience, she mentors undergraduate and postgraduate cohorts in designing fault-tolerant systems.",
      ],
      image: illustrations.systems,
      isDemoContent: false,
    },
    {
      slug: "owen-mercer",
      name: "Owen Mercer",
      role: "Senior Lecturer in Data Engineering",
      departmentSlug: "computing",
      credentials: [],
      bio: [
        "Owen Mercer specializes in large-scale data infrastructure, streaming ingestion pipelines, and reproducible data workflows.",
        "He leads hands-on laboratory modules focusing on data lineage, pipeline observability, and cloud storage architectures.",
      ],
      image: illustrations.data,
      isDemoContent: false,
    },
    {
      slug: "theo-rowan",
      name: "Theo Rowan",
      role: "Head of Electronic & Robotic Systems",
      departmentSlug: "electronic-and-robotic-systems",
      credentials: [],
      bio: [
        "Theo Rowan directs the Electronic and Robotic Systems department, focusing on embedded sensor networks, high-frequency circuits, and robotic control theory.",
        "His pedagogical work emphasizes bridge-building between mathematical simulation and hardware validation in rigorous laboratory environments.",
      ],
      image: illustrations.electronics,
      isDemoContent: false,
    },
    {
      slug: "nia-calder",
      name: "Nia Calder",
      role: "Senior Lecturer in Robotics & Kinematics",
      departmentSlug: "electronic-and-robotic-systems",
      credentials: [],
      bio: [
        "Nia Calder guides students through multi-body kinematics, real-time computer vision, and autonomous rover navigation.",
        "She coordinates annual robotic showcase projects and mentors student teams competing in national engineering challenges.",
      ],
      image: illustrations.robotics,
      isDemoContent: false,
    },
    {
      slug: "leena-vale",
      name: "Leena Vale",
      role: "Head of Sustainable Engineering",
      departmentSlug: "sustainable-engineering",
      credentials: [],
      bio: [
        "Leena Vale oversees research and teaching in renewable energy systems, grid-scale storage, and microgrid thermodynamics.",
        "Her curriculum encourages students to evaluate technological interventions through rigorous full-lifecycle impact assessments.",
      ],
      image: illustrations.energy,
      isDemoContent: false,
    },
    {
      slug: "ari-fenwick",
      name: "Ari Fenwick",
      role: "Senior Lecturer in Circular Materials & Design",
      departmentSlug: "sustainable-engineering",
      credentials: [],
      bio: [
        "Ari Fenwick teaches sustainable material engineering, circular manufacturing principles, and product disassembly strategies.",
        "He manages the Materials Characterization Studio, guiding students in developing biodegradable composites and repair-friendly hardware.",
      ],
      image: illustrations.materials,
      isDemoContent: false,
    },
    {
      slug: "jules-hart",
      name: "Jules Hart",
      role: "Head of Design & Human-Centred Technology",
      departmentSlug: "design-and-human-centred-technology",
      credentials: [],
      bio: [
        "Jules Hart is an interaction designer and educator whose work centers on universal accessibility, ethical computing, and user research.",
        "At Apex, Jules has pioneered an accessibility-first curriculum that embeds WCAG principles and multimodal interaction from day one.",
      ],
      image: illustrations.interaction,
      isDemoContent: false,
    },
    {
      slug: "soren-bell",
      name: "Soren Bell",
      role: "Senior Lecturer in Product Prototyping",
      departmentSlug: "design-and-human-centred-technology",
      credentials: [],
      bio: [
        "Soren Bell guides product design students through rapid physical prototyping, additive manufacturing, and user ergonomic testing.",
        "With a strong background in industrial design, he bridges mechanical engineering criteria with intuitive physical form factors.",
      ],
      image: illustrations.product,
      isDemoContent: false,
    },
  ],
  testimonials: [
    {
      id: "catalogue-comparison",
      quote:
        "The hands-on laboratory modules and project-first approach at Apex transformed how I approach complex software engineering. You don't just learn theory; you build systems that actually run under production constraints.",
      authorName: "Rae Linden",
      authorRole: "BEng Computer Science Graduate, Systems Engineer",
      isDemoContent: false,
    },
    {
      id: "evidence-notebook",
      quote:
        "Keeping detailed engineering journals and learning to prove why an architecture works made all the difference during my technical interviews. Apex taught us to treat engineering as an evidence-based discipline.",
      authorName: "Kit Arden",
      authorRole: "MEng Robotics Alumnus, Autonomous Systems Specialist",
      isDemoContent: false,
    },
    {
      id: "accessible-design",
      quote:
        "Designing for accessibility from the initial wireframe rather than treating it as an afterthought changed my entire design philosophy. The studio crits pushed me to think about every user.",
      authorName: "Emery Wells",
      authorRole: "BDes Interaction Design Student",
      isDemoContent: false,
    },
    {
      id: "study-questions",
      quote:
        "As an industry partner collaborating with Apex student teams on capstone projects, we are consistently impressed by their technical discipline, code hygiene, and ability to tackle complex constraints.",
      authorName: "Robin Hale",
      authorRole: "Director of Engineering, Cambridge CleanTech Partner",
      isDemoContent: false,
    },
    {
      id: "portfolio-explanation",
      quote:
        "The MSc in Data Engineering provided the exact bridge I needed to transition from general software into large-scale distributed data pipelines. The mentorship from faculty was outstanding.",
      authorName: "Alex Marlow",
      authorRole: "MSc Data Engineering Graduate, Senior Data Architect",
      isDemoContent: false,
    },
  ],
  facilities: [
    {
      slug: "computing-systems-laboratory",
      name: "Computing Systems & Distributed Infrastructure Laboratory",
      summary:
        "High-performance cluster workstations, isolated networks for security analysis, and collaborative code-review pods.",
      body: [
        "Our computing systems laboratory provides advanced hardware infrastructure for distributed computing, cloud architecture testing, and compiler engineering.",
        "Equipped with high-performance multi-core workstations and private cluster nodes, the facility supports student teams running continuous integration and performance benchmarking suites.",
        "Workstations feature dual-boot Linux environments and complete access to modern development tools, profiling suites, and containerized deployment platforms.",
      ],
      image: illustrations.systems,
      isDemoContent: false,
    },
    {
      slug: "electronics-and-robotics-laboratory",
      name: "Electronics & Autonomous Robotics Studio",
      summary:
        "Equipped with digital oscilloscopes, spectrum analyzers, surface-mount soldering stations, and an autonomous arena.",
      body: [
        "This laboratory bridges electronic circuit prototyping with physical robotics testing, housing calibrated test benches and an open testing floor for autonomous rovers.",
        "Students have access to digital oscilloscopes, arbitrary waveform generators, thermal imaging cameras, and precision rework stations for surface-mount assembly.",
        "Trained laboratory technicians maintain safe operating procedures and support students in building custom hardware prototypes from initial breadboard to populated PCB.",
      ],
      image: illustrations.electronics,
      isDemoContent: false,
    },
    {
      slug: "energy-and-materials-studio",
      name: "Sustainable Energy & Materials Characterisation Suite",
      summary:
        "Specialised instrumentation for testing solar cell efficiencies, battery charge cycles, and thermal conductivity.",
      body: [
        "The Sustainable Energy and Materials Suite supports experimental inquiry into renewable energy generation, battery chemistries, and circular materials.",
        "Students perform tensile tests, spectroscopic material analysis, and thermodynamic measurements under controlled laboratory conditions.",
        "The space facilitates research into bio-composite materials, low-loss energy conversion, and life-cycle assessment of consumer hardware.",
      ],
      image: illustrations.energy,
      isDemoContent: false,
    },
    {
      slug: "design-and-prototyping-studio",
      name: "Rapid Prototyping & Human Factors Design Studio",
      summary:
        "Precision laser cutting, 3D additive printing suites, digital drawing tablets, and an ergonomics observation lab.",
      body: [
        "Our design and prototyping studio allows students to translate digital concepts into tangible physical artifacts rapidly.",
        "The facility features multi-material 3D printers, laser cutters, vacuum formers, and dedicated sketching benches for iterative physical modelling.",
        "An adjacent human-factors observation room enables students to conduct video-recorded user testing and ergonomic evaluations with participants.",
      ],
      image: illustrations.product,
      isDemoContent: false,
    },
    {
      slug: "library-and-reading-room",
      name: "Technical Library & Digital Research Commons",
      summary:
        "Comprehensive holdings of IEEE, ACM, and technical journals, with quiet study carrels and collaborative research tables.",
      body: [
        "The Apex Technical Library provides extensive physical and digital access to leading engineering, computing, and design publications, including full IEEE Xplore and ACM Digital Library subscriptions.",
        "Quiet study carrels offer focused research space, while adjacent seminar rooms provide presentation screens for student study groups.",
        "Specialist research librarians offer guidance on technical literature reviews, patent searches, and citation management.",
      ],
      image: illustrations.library,
      isDemoContent: false,
    },
    {
      slug: "project-and-community-commons",
      name: "Engineering Exchange & Project Commons",
      summary:
        "Open-plan student atrium for hackathons, capstone presentations, study groups, and employer networking sessions.",
      body: [
        "The Project Commons serves as the collaborative heart of the Apex campus, hosting student hackathons, capstone exhibitions, and community tech meetups.",
        "With modular presentation furniture, large-format display screens, and flexible breakout spaces, the commons facilitates cross-departmental collaboration.",
        "Regular employer showcase evenings and alumni mentoring sessions take place here throughout the academic year.",
      ],
      image: illustrations.commons,
      isDemoContent: false,
    },
  ],
  faqs: [
    {
      id: "entry-requirements",
      category: "Admissions",
      question: "What are the entry requirements for undergraduate engineering programmes?",
      answer: [
        "Standard entry for our BEng and MEng programmes requires strong performance in Mathematics and either Physics, Computer Science, or Chemistry.",
        "We also welcome equivalent international qualifications and review vocational engineering diplomas. Full entry criteria for each specific pathway are detailed in our admissions prospectus.",
      ],
    },
    {
      id: "placement-year",
      category: "Industry Placements",
      question: "Are industrial placements and internships supported?",
      answer: [
        "Yes. All undergraduate degree pathways offer an optional 12-month paid industrial placement year between the penultimate and final years of study.",
        "Our dedicated Careers and Industry Partnerships team provides comprehensive placement preparation, CV clinics, technical mock interviews, and established links with leading tech employers.",
      ],
    },
    {
      id: "qualification-status",
      category: "Accreditation",
      question: "Are Apex Institute of Technology degree programmes formally accredited?",
      answer: [
        "Our degree programmes are designed to align with the standards of the Institution of Engineering and Technology (IET) and the British Computer Society (BCS).",
        "Graduates meet the educational requirements toward Chartered Engineer (CEng) and Chartered IT Professional (CITP) registration.",
      ],
    },
    {
      id: "compare-pathways",
      category: "Study Planning",
      question: "How do I choose between Computer Science, Electronic Systems, and Robotics?",
      answer: [
        "We encourage prospective students to consider whether their core interest lies in pure software and data systems (Computer Science), hardware circuits and signal processing (Electronic Systems), or physical actuation and autonomous control (Robotics).",
        "Because our first-year curriculum shares fundamental engineering mathematics and programming modules, internal pathway transfers are supported subject to academic review.",
      ],
    },
    {
      id: "fictional-people",
      category: "Faculty & Mentorship",
      question: "Who teaches the courses and mentors student projects?",
      answer: [
        "All modules are led by qualified academic staff and experienced researchers who are active contributors to their respective fields.",
        "Undergraduate students are assigned a personal academic tutor from their department who provides individual mentorship throughout their degree.",
      ],
    },
    {
      id: "laboratory-visits",
      category: "Campus Visits",
      question: "Can prospective students tour the laboratories and studios?",
      answer: [
        "Yes. Guided tours of our computing labs, robotics floor, prototyping studios, and materials suites are an integral part of our open day events.",
        "Individual visits can also be arranged through our admissions team during term time, allowing prospective applicants to observe classes and projects in session.",
      ],
    },
    {
      id: "event-registration",
      category: "Events",
      question: "How do I register for open days, colloquiums, and workshops?",
      answer: [
        "Registration for upcoming open days, public colloquiums, and technical workshops is available through the events section of our website or by contacting our events office.",
        "Attendance is free of charge, though places for specialized laboratory sessions are limited to ensure safe and effective participation.",
      ],
    },
    {
      id: "applications-and-personal-data",
      category: "Admissions Support",
      question: "How do I submit an inquiry or apply for an academic programme?",
      answer: [
        "Applications for undergraduate courses are submitted through national admissions services or via our direct international portal.",
        "For preliminary questions about course suitability, fee structures, or campus accommodation, please use our contact form or email our admissions registry directly.",
      ],
    },
  ],
  policies: [
    {
      slug: "privacy",
      title: "Privacy Policy",
      updatedAt: "2026-09-09",
      body: [
        "Data Protection Principles. Apex Institute of Technology is committed to safeguarding personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.",
        "Information We Collect. We collect personal information including your name, contact details, academic history, and communication preferences when you register for an open day, submit an admissions enquiry, or enrol in our programmes.",
        "How We Use Personal Data. Your data is used exclusively to process admissions inquiries, administer academic courses, provide student support services, ensure campus safety, and fulfill statutory reporting obligations.",
        "Lawful Basis for Processing. We process personal information under defined lawful bases, including contractual necessity for enrolled students, legal obligation for statutory compliance, and legitimate educational interests.",
        "Information Security. We implement robust technical and organisational security measures, including multi-factor authentication and encrypted storage, to protect all institutional records against unauthorised access or loss.",
        "Data Retention Periods. Personal data is retained strictly in accordance with our institutional retention schedule and statutory guidelines governing higher education student records and financial transactions.",
        "Sharing with Third Parties. We do not sell or lease personal information. Data is shared solely with verified education partners, examination boards, and regulatory bodies where required by law.",
        "Your Data Rights. Under data protection law, you have rights to access, rectify, or request erasure of your personal data, as well as to restrict or object to its processing. To exercise these rights, contact privacy@apex-technology.ac.uk.",
      ],
    },
    {
      slug: "terms",
      title: "Terms of Website Use",
      updatedAt: "2026-09-09",
      body: [
        "Terms of Use. Welcome to the official website of Apex Institute of Technology. By accessing or using this website, you agree to comply with and be bound by these Terms of Website Use.",
        "Intellectual Property. All content, trademarks, graphics, code, and documents published on this site are the intellectual property of Apex Institute of Technology or licensed for its use, and are protected by applicable copyright law.",
        "Acceptable Use. You agree to use our website only for lawful purposes. You must not attempt to compromise website security, introduce malicious software, or harvest personal data without authorisation.",
        "Course Information and Accuracy. While we make every effort to ensure course descriptions, entry requirements, and fee schedules are up to date, the Institute reserves the right to amend curricula, staffing, and facilities as necessary.",
        "External Links. Our website may contain links to third-party academic resources, professional bodies, and partner organisations. Apex Institute of Technology is not responsible for the content or privacy practices of external websites.",
        "Limitation of Liability. Apex Institute of Technology provides this website on an 'as is' basis and accepts no liability for any temporary site unavailability, transmission delays, or technical errors beyond our reasonable control.",
        "Privacy Integration. Your use of this website is also governed by our Privacy Policy, which outlines our practices concerning cookies, analytical data, and personal information handling.",
        "Governing Law. These terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising in connection with this website shall be subject to the exclusive jurisdiction of the English courts.",
      ],
    },
    {
      slug: "academic-integrity",
      title: "Academic Integrity Policy",
      updatedAt: "2026-09-09",
      body: [
        "Commitment to Integrity. Apex Institute of Technology upholds the highest standards of academic honesty, intellectual rigor, and ethical research conduct across all undergraduate and postgraduate programmes.",
        "Principles of Proper Attribution. Students and researchers must clearly attribute all ideas, code, hardware designs, datasets, and quotations drawn from external sources using accepted academic citation frameworks.",
        "Collaborative Work and Individual Responsibility. When working in laboratory teams or capstone groups, students must explicitly document individual contributions and adhere strictly to specified assessment boundaries.",
        "Data Integrity and Experimental Honesty. Fabricating experimental data, misrepresenting simulation results, or altering laboratory measurements constitutes severe academic misconduct and is subject to formal disciplinary action.",
        "Responsible Use of Generative AI. The use of generative AI tools must be transparently disclosed in project journals and dissertation submissions, in full accordance with departmental assessment guidelines.",
        "Academic Support and Guidance. The Institute provides workshops, academic writing clinics, and dedicated tutoring to assist students in developing sound research methods and citation discipline.",
        "Investigation and Disciplinary Procedures. Suspected breaches of academic integrity are investigated fairly and impartially through our Academic Misconduct Panel, ensuring full rights of response and appeal.",
        "Policy Governance and Review. This policy is reviewed annually by the Academic Senate to maintain alignment with emerging technological developments, pedagogical best practices, and professional engineering standards.",
      ],
    },
    {
      slug: "accessibility",
      title: "Website Accessibility Statement",
      updatedAt: "2026-09-09",
      body: [
        "Accessibility Commitment. Apex Institute of Technology is committed to ensuring our digital resources and web services are accessible to all users, in accordance with the Web Content Accessibility Guidelines (WCAG 2.1) Level AA.",
        "Design Standards. Our digital platforms are engineered with semantic HTML5 elements, high-contrast typography, keyboard navigation support, visible focus indicators, and descriptive alternative text for all informational imagery.",
        "Assistive Technology Support. Our web pages are designed and tested for compatibility with leading screen readers, speech-recognition software, and assistive navigation devices.",
        "Alternative Formats. If you need any institutional publication, course syllabus, or policy document in an alternative format such as large print, accessible PDF, or braille, please contact our accessibility team.",
        "Multimedia and Visual Assets. Videos and recorded lectures published by the Institute include synchronized captions, transcripts, and audio descriptions to support diverse learning requirements.",
        "Continuous Testing and Auditing. We perform regular automated accessibility scanning alongside manual keyboard audits to identify and rectify potential accessibility barriers promptly.",
        "Third-Party Services. While we strive for universal accessibility across our web presence, some external portal integrations may feature limitations; we actively collaborate with vendors to enhance compliance.",
        "Feedback and Contact. We welcome feedback regarding our website accessibility. If you encounter any difficulty accessing content, please contact us at accessibility@apex-technology.ac.uk.",
      ],
    },
    {
      slug: "complaints",
      title: "Feedback and Complaints Procedure",
      updatedAt: "2026-09-09",
      body: [
        "Procedure Overview. Apex Institute of Technology values constructive feedback and is committed to addressing concerns from students, applicants, and visitors promptly, fairly, and transparently.",
        "Stage 1: Informal Resolution. Complainants are encouraged to raise concerns informally with the relevant module leader, tutor, or department administrator, who will seek to resolve the issue directly.",
        "Stage 2: Formal Investigation. If a concern cannot be resolved informally, a formal complaint may be submitted in writing to the Academic Registrar, who will conduct a comprehensive investigation and respond within 15 working days.",
        "Stage 3: Complaints Review Panel. If the complainant is dissatisfied with the formal outcome, they may request a hearing before an independent Complaints Review Panel chaired by a senior academic officer.",
        "Independent External Review. Following completion of the internal procedures, students may refer their complaint to the Office of the Independent Adjudicator for Higher Education (OIA).",
        "Confidentiality and Fairness. All complaints are treated with strict confidentiality, and individuals raising concerns in good faith will not suffer any academic or institutional detriment.",
        "Record Keeping and Analysis. The Institute logs and categorizes all formal complaints to identify systemic issues and drive continuous institutional improvements.",
        "Governance and Annual Review. An annual summary of complaints and corrective actions is presented to the Board of Governors to ensure institutional accountability and procedural efficacy.",
      ],
    },
  ],
  stats: [
    {
      id: "sample-pathways",
      label: "Degree & Research Programs",
      value: "8+",
      caption:
        "Specialised undergraduate and postgraduate degrees in engineering, computing, and technology.",
      isDemoContent: false,
    },
    {
      id: "sample-departments",
      label: "Academic Departments",
      value: "4",
      caption:
        "Computing, Electronic & Robotic Systems, Sustainable Engineering, Human-Centred Tech.",
      isDemoContent: false,
    },
    {
      id: "sample-space-concepts",
      label: "Specialist Research Labs & Studios",
      value: "6",
      caption:
        "Equipped fabrication spaces, robotics facilities, computing suites, and collaborative commons.",
      isDemoContent: false,
    },
  ],
} satisfies Omit<TenantContentInput, "gallery" | "downloads" | "pageSections">;
