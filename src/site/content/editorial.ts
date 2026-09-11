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

/** Fictional editorial catalogue only. Never import sections or the tenant root here. */
export const editorial = {
  news: [
    {
      slug: "reading-a-study-pathway",
      title: "A practical guide to reading the sample study catalogue",
      excerpt:
        "Compare eight fictional pathways by subject, project approach and the questions you would ask a real provider.",
      publishedAt: "2026-09-08",
      category: "Study planning",
      image: illustrations.systems,
      body: [
        "This demonstration guide introduces eight sample pathways across computing, electronic systems, sustainable engineering and design. The degree-style titles organise example content; they do not describe courses that Apex awards, offers or has had recognised.",
        "Begin with the subject questions rather than the qualification label. Compare the proposed project work, sample duration and department description, then note which skills you would like to practise and what support you might need.",
        "For an actual study decision, obtain approved information from a verified provider about entry criteria, assessment, fees, delivery and the awarding body. This catalogue cannot establish eligibility, reserve a place or confirm a qualification.",
      ],
      isDemoContent: true,
    },
    {
      slug: "repairable-sensor-project-brief",
      title: "Project notebook: designing a sensor that can be repaired",
      excerpt:
        "An illustrative project brief connects component choices, readable documentation and a plan for testing repairs.",
      publishedAt: "2026-09-03",
      category: "Project briefs",
      image: illustrations.electronics,
      body: [
        "The fictional brief asks a team to sketch a low-voltage sensor enclosure with replaceable parts. It is an example of how a technical question could be presented, not a report of an operating laboratory or completed research.",
        "A useful notebook would separate design assumptions from observations. Suggested entries include a labelled connection diagram, a parts list, a safe inspection sequence and an explanation of how a damaged component could be identified.",
        "A review could compare repair access with cost, material use and reliability. No tested prototype, measured improvement or external collaboration is claimed; any real electrical work would require suitable supervision and a separate safety assessment.",
      ],
      isDemoContent: true,
    },
    {
      slug: "data-provenance-notebook",
      title: "Make a data pipeline explain where its inputs came from",
      excerpt:
        "A sample data engineering exercise follows a synthetic dataset from collection assumptions to a reproducible output.",
      publishedAt: "2026-08-26",
      category: "Computing",
      image: illustrations.data,
      body: [
        "This editorial exercise uses invented transport records to explore data provenance. The records do not describe real journeys or individuals, and the article does not claim that a class, publication or commissioned project has taken place.",
        "The proposed task is to document each transformation, define what a missing value means and preserve a small set of examples for checking later changes. A reader should be able to distinguish source assumptions from derived fields.",
        "A sample review would ask whether another person could reproduce the output and spot an invalid input. Read the Data Engineering MSc demonstration pathway for related themes, not for a promise of instruction, professional certification or employment.",
      ],
      isDemoContent: true,
    },
    {
      slug: "accessible-interface-critique",
      title: "A design critique that starts with keyboard navigation",
      excerpt:
        "An illustrative interface review considers focus order, labels and understandable errors before visual decoration.",
      publishedAt: "2026-08-14",
      category: "Design practice",
      image: illustrations.interaction,
      body: [
        "The sample design scenario is a fictional equipment-booking interface. No booking service runs on this website. Its purpose is to show how a design brief can begin with access needs instead of assuming every visitor uses a pointer.",
        "The suggested critique follows the task from selecting an item to reviewing the request. Reviewers would record the focus sequence, check whether labels make sense without surrounding imagery and explain how an error could be corrected.",
        "A written critique should distinguish a planned improvement from a verified finding. This article reports no user study or accessibility certification; a real service would need testing with relevant users and assistive technologies.",
      ],
      isDemoContent: true,
    },
    {
      slug: "career-portfolio-evidence",
      title: "Build a portfolio around decisions, not inflated outcomes",
      excerpt:
        "Sample career preparation prompts help explain a project contribution without claiming employment results.",
      publishedAt: "2026-07-29",
      category: "Career preparation",
      image: illustrations.review,
      body: [
        "This demonstration career note proposes a simple portfolio structure: the question, your contribution, the alternatives considered and the next uncertainty. It is preparation guidance, not evidence of a placement service or a recruiting relationship.",
        "For a group exercise, explain which parts you authored and which decisions were shared. Use synthetic data or material you have permission to show, and remove personal or confidential information before circulating a portfolio.",
        "A mock interview could practise explaining one trade-off in plain language. No employer interview, placement, salary or job outcome is promised. Actual opportunities must be checked independently with the organisation advertising them.",
      ],
      isDemoContent: true,
    },
    {
      slug: "material-use-design-journal",
      title: "Record material choices before drawing a final product",
      excerpt:
        "A fictional design journal compares disassembly, repair access and uncertainty in material information.",
      publishedAt: "2026-07-10",
      category: "Sustainable engineering",
      image: illustrations.materials,
      body: [
        "This sample journal begins with a desk-lamp concept rather than an existing product. It demonstrates a way to document material decisions; it is not a claim that a device has been manufactured, tested or made commercially available.",
        "The proposed comparison records how parts would be joined, which components could be separated and where reliable material information would be needed. Uncertain assumptions stay visible instead of being converted into environmental performance figures.",
        "An illustrative final review would compare two designs and explain what evidence could change the preference. No sustainability rating, measured saving or certification is asserted, and real fabrication requires appropriate equipment and safety guidance.",
      ],
      isDemoContent: true,
    },
  ],
  events: [
    {
      slug: "sample-project-notebook-july",
      title: "Sample archive: project notebook workshop",
      category: "Project practice",
      summary:
        "A fictional July calendar entry about documenting design assumptions; not a record of an event that took place.",
      startsAt: "2026-07-16",
      endsAt: "2026-07-16",
      location: "Illustrative project commons — no actual venue",
      image: illustrations.commons,
      body: [
        "This past-dated demonstration entry outlines a workshop on keeping a project notebook. Its proposed sequence is to frame a question, list assumptions and plan a small check using synthetic information. No attendance or completed workshop is reported.",
        "The sample take-away would be a one-page template separating evidence, interpretation and open questions. The July date exists to demonstrate the archive view; there is no registration, recording, certificate or physical venue associated with this entry.",
      ],
      isDemoContent: true,
    },
    {
      slug: "sample-design-critique-august",
      title: "Sample archive: inclusive interface critique",
      category: "Design practice",
      summary:
        "An illustrative August calendar entry exploring labels and keyboard flow, not an account of a delivered session.",
      startsAt: "2026-08-20",
      endsAt: "2026-08-20",
      location: "Illustrative design studio — no actual venue",
      image: illustrations.interaction,
      body: [
        "The fictional critique brief proposes reviewing a paper interface before adding visual styling. Participants in the scenario would trace a task, identify unclear instructions and describe an alternative route through the same information.",
        "This is sample archive content, not a report of feedback from real people. The past date demonstrates calendar grouping only. No session was delivered, no user study is claimed and no place can be booked through this website.",
      ],
      isDemoContent: true,
    },
    {
      slug: "sample-pathway-exploration-october",
      title: "Sample calendar: engineering pathway exploration",
      category: "Study planning",
      summary:
        "An October demonstration agenda for comparing engineering and design interests; not a scheduled open day.",
      startsAt: "2026-10-14",
      endsAt: "2026-10-14",
      location: "Demonstration agenda only — no actual venue",
      image: illustrations.exhibition,
      body: [
        "This fictional future entry sketches a sequence for exploring the catalogue: choose two subject questions, compare the associated project briefs and list the support or equipment each might need. It does not announce an actual open day.",
        "The proposed discussion would finish with a checklist for verifying a real provider's course and entry information. The October date is sample data; do not travel, book accommodation or send application documents on its basis. Registration is not available.",
      ],
      isDemoContent: true,
    },
    {
      slug: "sample-repair-design-november",
      title: "Sample calendar: repair-first design discussion",
      category: "Design practice",
      summary:
        "A November sample agenda links electronics and material choices through a fictional repairability brief.",
      startsAt: "2026-11-12",
      endsAt: "2026-11-12",
      location: "Demonstration agenda only — no actual venue",
      image: illustrations.robotics,
      body: [
        "The illustrative discussion would compare two enclosure sketches and ask how someone could reach, identify and replace a component. The exercise is a paper-based project idea, not instructions for operating machinery or an invitation to a laboratory.",
        "A proposed closing review would record unresolved safety, access and materials questions. This future date is not a commitment to deliver an event. There are no tickets, confirmed facilitators, attendance awards or external collaborators attached to this sample entry.",
      ],
      isDemoContent: true,
    },
    {
      slug: "sample-portfolio-review-december",
      title: "Sample calendar: explaining a technical portfolio",
      category: "Career preparation",
      summary:
        "A December demonstration agenda for discussing project decisions honestly, without recruitment promises.",
      startsAt: "2026-12-03",
      endsAt: "2026-12-03",
      location: "Demonstration agenda only — no actual venue",
      image: illustrations.review,
      body: [
        "This fictional agenda suggests choosing one project decision, presenting the alternatives and identifying the evidence still needed. It illustrates a career preparation conversation rather than a recruiter event or a service offered by a real institution.",
        "A reader could use the prompts independently with a sample portfolio, avoiding confidential work and personal records. The December date is solely for the demonstration calendar; no interview, work placement, employment outcome or booking is available here.",
      ],
      isDemoContent: true,
    },
  ],
  programs: [
    {
      slug: "computer-science-beng",
      name: "Computer Science BEng — demonstration pathway",
      summary:
        "A fictional computing pathway connecting algorithms, systems and maintainable software. Not a real awarded or recognised course.",
      body: [
        "This BEng-labelled example explores how software behaves beyond the first successful run. The title and four-year outline are demonstration content only: Apex does not offer or award this qualification, and no academic or professional recognition is claimed.",
        "The proposed sequence moves from programming and discrete structures to operating systems, networks and collaborative software design. A sample project would compare a simple service under changing inputs, document failure cases and make its tests reproducible.",
        "A portfolio discussion could explain design choices, code review and the limits of a prototype. There is no compulsory or guaranteed placement. Verify any real provider's awarding arrangements, entry requirements, assessment and support before considering an application.",
      ],
      departmentSlug: "computing",
      levelLabel: "Sample undergraduate pathway",
      durationLabel: "Illustrative outline: 4 years",
      highlights: [
        "Algorithm reasoning exercises",
        "Systems and software test plans",
        "Documented team project decisions",
      ],
      image: illustrations.systems,
      isDemoContent: true,
    },
    {
      slug: "data-engineering-msc",
      name: "Data Engineering MSc — demonstration pathway",
      summary:
        "A fictional postgraduate outline for pipelines, data quality and reproducibility. Not an offered or recognised master's course.",
      body: [
        "This MSc-labelled demonstration uses synthetic datasets to explore dependable data platforms. The one-year outline is a content example, not an available course or an awarded, accredited or recognised qualification.",
        "Suggested topics include ingestion contracts, storage trade-offs, lineage and recovery after partial failure. A sample brief asks for a small pipeline with explicit assumptions, repeatable transformations and checks that make a changed input visible.",
        "A proposed portfolio would explain why a design was chosen and where it would need further evaluation. It does not confer professional status or access to employment. Ask a verified provider about prerequisites, teaching, assessment and actual awarding arrangements.",
      ],
      departmentSlug: "computing",
      levelLabel: "Sample postgraduate pathway",
      durationLabel: "Illustrative outline: 1 year",
      highlights: [
        "Synthetic data pipeline briefs",
        "Data quality and provenance",
        "Recovery and reproducibility plans",
      ],
      image: illustrations.data,
      isDemoContent: true,
    },
    {
      slug: "electronic-systems-beng",
      name: "Electronic Systems BEng — demonstration pathway",
      summary:
        "An illustrative route through circuits, sensing and embedded logic, not a real degree offer or recognised qualification.",
      body: [
        "This fictional BEng pathway shows how electronics content might connect measurement with system design. Its degree label and duration are illustrative, not evidence of provision, awarding powers or recognition by any professional body.",
        "A proposed sequence covers circuit models, signal interpretation and embedded state machines before a repairable sensor brief. Paper models and simulations would be documented separately from physical measurements so assumed values are not presented as verified results.",
        "The sample review would consider uncertainty, safe test planning and readable wiring documentation. No laboratory access or equipment training is included. A real course would need approved safety arrangements, delivery details and entry criteria from a verified provider.",
      ],
      departmentSlug: "electronic-and-robotic-systems",
      levelLabel: "Sample undergraduate pathway",
      durationLabel: "Illustrative outline: 3 years",
      highlights: [
        "Circuit modelling notebooks",
        "Embedded logic design",
        "Measurement uncertainty reviews",
      ],
      image: illustrations.electronics,
      isDemoContent: true,
    },
    {
      slug: "robotics-and-autonomy-meng",
      name: "Robotics and Autonomy MEng — demonstration pathway",
      summary:
        "A fictional integrated pathway exploring sensing, control and simulation; not an awarded or recognised engineering course.",
      body: [
        "This MEng-labelled example connects mechanical constraints with software decisions in a simulated robot. It is not a real integrated master's course, admission offer or recognised qualification, and the stated duration is only a planning illustration.",
        "The proposed work moves through geometry, control and sensor interpretation before a simulated navigation task. A project notebook would identify environmental assumptions, explain how failures are detected and separate simulation behaviour from claims about physical performance.",
        "A final discussion could compare strategies under the same synthetic test conditions. No operational robot, autonomous deployment or placement is promised. Physical experimentation would require specialist supervision, risk assessment and verified course arrangements elsewhere.",
      ],
      departmentSlug: "electronic-and-robotic-systems",
      levelLabel: "Sample integrated postgraduate pathway",
      durationLabel: "Illustrative outline: 4 years",
      highlights: [
        "Simulation-first project briefs",
        "Control and sensing trade-offs",
        "Documented failure conditions",
      ],
      image: illustrations.robotics,
      isDemoContent: true,
    },
    {
      slug: "sustainable-energy-beng",
      name: "Sustainable Energy BEng — demonstration pathway",
      summary:
        "An example pathway for energy balances and system assumptions, not a recognised degree or an environmental performance claim.",
      body: [
        "This fictional BEng outline considers how energy moves through a small system and how modelling assumptions affect a decision. It is not an offered, awarded or recognised qualification; the title organises a demonstration catalogue.",
        "Proposed topics include heat transfer, electrical demand and interpreting uncertain inputs. An example project would model an invented workspace, compare operating scenarios and state clearly which values are assumptions rather than measured building data.",
        "A review could ask what evidence would be needed before recommending any change. No energy saving, installation capability or professional authorisation is claimed. Confirm actual assessment, facilities and awarding details directly with a verified education provider.",
      ],
      departmentSlug: "sustainable-engineering",
      levelLabel: "Sample undergraduate pathway",
      durationLabel: "Illustrative outline: 3 years",
      highlights: [
        "Energy balance exercises",
        "Scenario and uncertainty modelling",
        "Evidence-aware design reviews",
      ],
      image: illustrations.energy,
      isDemoContent: true,
    },
    {
      slug: "materials-and-circular-design-msc",
      name: "Materials and Circular Design MSc — demonstration pathway",
      summary:
        "A fictional outline connecting material selection, repair and disassembly; not an available or recognised master's course.",
      body: [
        "This MSc-labelled sample explores how product decisions affect repair and material separation. It is demonstration content, not an awarded or recognised course, a sustainability credential or a statement of laboratory capability.",
        "The proposed sequence compares material properties, joining methods and the limits of lifecycle information. A sample brief would document two enclosure concepts and identify where reliable sourcing, testing and disposal information would be needed.",
        "An illustrative portfolio would explain trade-offs without turning assumptions into environmental impact figures. No commercial project, certification or professional membership is included. Verify prerequisites, assessment and qualification status with a real provider before applying.",
      ],
      departmentSlug: "sustainable-engineering",
      levelLabel: "Sample postgraduate pathway",
      durationLabel: "Illustrative outline: 1 year",
      highlights: [
        "Material selection comparisons",
        "Repair and disassembly concepts",
        "Uncertainty in lifecycle evidence",
      ],
      image: illustrations.materials,
      isDemoContent: true,
    },
    {
      slug: "interaction-design-bdes",
      name: "Interaction Design BDes — demonstration pathway",
      summary:
        "An illustrative design pathway for usable interfaces and inclusive task flows, not an awarded or recognised design degree.",
      body: [
        "This BDes-labelled example explores how people understand and move through information. The pathway and three-year outline are fictional; they are not a real course offer, recognised qualification or guarantee of professional competence.",
        "Suggested work begins with task mapping, plain-language instructions and paper prototypes before considering keyboard access and error recovery. A sample critique would record hypotheses separately from observations and avoid inventing participants or user research findings.",
        "The proposed portfolio would explain a design revision and the evidence still needed to assess it. No live client work or placement is promised. A verified provider must supply actual entry, support, assessment and awarding information for any real application.",
      ],
      departmentSlug: "design-and-human-centred-technology",
      levelLabel: "Sample undergraduate pathway",
      durationLabel: "Illustrative outline: 3 years",
      highlights: [
        "Task and information mapping",
        "Accessible interaction critiques",
        "Evidence-labelled prototype journals",
      ],
      image: illustrations.interaction,
      isDemoContent: true,
    },
    {
      slug: "product-design-technology-bsc",
      name: "Product Design Technology BSc — demonstration pathway",
      summary:
        "A fictional route from a product question to a documented prototype concept, not an offered or recognised degree.",
      body: [
        "This BSc-labelled demonstration links technical drawings with thoughtful product decisions. Its duration and qualification wording are illustrative only; Apex does not offer, award or claim recognition for this pathway.",
        "A proposed sequence covers form, tolerances and assembly before a low-fidelity desk-accessory concept. The sample brief asks for clear drawings, a repair plan and a record of what can and cannot be learned from a non-functional model.",
        "An illustrative review would consider usability, material choices and the next safe test to undertake. No manufactured product or verified user benefit is claimed. Confirm equipment access, supervision, course status and costs with an actual provider.",
      ],
      departmentSlug: "design-and-human-centred-technology",
      levelLabel: "Sample undergraduate pathway",
      durationLabel: "Illustrative outline: 3 years",
      highlights: [
        "Readable technical drawings",
        "Low-fidelity product concepts",
        "Assembly and repair narratives",
      ],
      image: illustrations.product,
      isDemoContent: true,
    },
  ],
  departments: [
    {
      slug: "computing",
      name: "Department of Computing",
      summary:
        "A fictional department grouping software systems and data engineering examples, led by a clearly invented profile.",
      body: [
        "The demonstration Computing department connects the Computer Science BEng and Data Engineering MSc sample pathways. It provides an editorial home for algorithms, software reliability and data provenance, not evidence of an operating academic department.",
        "Its illustrative projects use synthetic inputs and documented tests to show how a technical argument can be checked. Fictional lead Mira Ellis introduces the sample approach; no staff appointment, external affiliation, qualification delivery or research output is claimed.",
      ],
      leadPersonSlug: "mira-ellis",
      image: illustrations.systems,
      isDemoContent: true,
    },
    {
      slug: "electronic-and-robotic-systems",
      name: "Department of Electronic and Robotic Systems",
      summary:
        "A demonstration department for circuit reasoning, embedded logic and simulation-first robotics briefs.",
      body: [
        "This fictional department groups the Electronic Systems BEng and Robotics and Autonomy MEng demonstration pathways. Its editorial focus is the relationship between sensing, control and clearly stated physical assumptions, not a claim of available teaching or equipment.",
        "Sample projects compare models before proposing physical tests, keeping uncertainty and safety questions visible. Fictional lead Theo Rowan anchors the people example. Real laboratory work would need verified facilities, trained supervision and separate safety procedures.",
      ],
      leadPersonSlug: "theo-rowan",
      image: illustrations.electronics,
      isDemoContent: true,
    },
    {
      slug: "sustainable-engineering",
      name: "Department of Sustainable Engineering",
      summary:
        "A fictional department connecting energy modelling and material choices without environmental performance claims.",
      body: [
        "The demonstration Sustainable Engineering department groups the Sustainable Energy BEng and Materials and Circular Design MSc examples. The subject descriptions explore how assumptions shape decisions; they do not establish a recognised course, laboratory or sustainability credential.",
        "Illustrative briefs consider an invented workspace and a repairable enclosure, with explicit gaps where measurement would be needed. Fictional lead Leena Vale appears only as sample profile data. No measured savings, published research or commercial collaborations are represented.",
      ],
      leadPersonSlug: "leena-vale",
      image: illustrations.energy,
      isDemoContent: true,
    },
    {
      slug: "design-and-human-centred-technology",
      name: "Department of Design and Human-centred Technology",
      summary:
        "A demonstration department for interaction and product design, with inclusive task flows and readable project journals.",
      body: [
        "This fictional department connects the Interaction Design BDes and Product Design Technology BSc sample pathways. It explores how sketches, instructions and prototypes communicate an idea, without implying a real design course or access to studio teaching.",
        "Suggested critiques distinguish design hypotheses from verified user feedback and consider access needs from the beginning. Fictional lead Jules Hart is an illustrative character, not a real appointment. No client work, user study or professional affiliation is asserted.",
      ],
      leadPersonSlug: "jules-hart",
      image: illustrations.interaction,
      isDemoContent: true,
    },
  ],
  people: [
    {
      slug: "mira-ellis",
      name: "Mira Ellis",
      role: "Fictional computing lead and editorial guide",
      departmentSlug: "computing",
      credentials: [],
      bio: [
        "Mira Ellis is an invented character used to demonstrate a computing lead profile and an illustrative leadership message. This is not a real staff identity, appointment, academic credential or professional affiliation.",
        "The sample role connects software reasoning with clear project explanations. Its suggested discussion prompts ask what a prototype assumes, how a test could disprove an idea and what another reader would need to repeat the work.",
      ],
      image: illustrations.systems,
      isDemoContent: true,
    },
    {
      slug: "owen-mercer",
      name: "Owen Mercer",
      role: "Fictional data systems tutor",
      departmentSlug: "computing",
      credentials: [],
      bio: [
        "Owen Mercer is a fictional profile for the data engineering demonstration. The name and teaching role are invented; no qualifications, employment history, professional membership or relationship to a real person are claimed.",
        "The illustrative role asks how a dataset's origin, transformations and limitations can remain visible. Sample activities involve synthetic records, reproducible notebooks and clear explanations of missing information rather than real client data.",
      ],
      image: illustrations.data,
      isDemoContent: true,
    },
    {
      slug: "theo-rowan",
      name: "Theo Rowan",
      role: "Fictional electronic and robotic systems lead",
      departmentSlug: "electronic-and-robotic-systems",
      credentials: [],
      bio: [
        "Theo Rowan is an invented department lead in this demonstration catalogue. The profile does not describe a real engineer, faculty appointment, doctorate, professional registration or laboratory supervisor.",
        "The sample editorial role links circuit models to questions about measurement and safe test planning. Its project prompts distinguish what a simulation suggests from what a physical experiment would still need to establish.",
      ],
      image: illustrations.electronics,
      isDemoContent: true,
    },
    {
      slug: "nia-calder",
      name: "Nia Calder",
      role: "Fictional robotics project tutor",
      departmentSlug: "electronic-and-robotic-systems",
      credentials: [],
      bio: [
        "Nia Calder is a fictional character illustrating a robotics project tutor profile. No actual appointment, qualification, professional affiliation or supervised robotics activity is represented by this biography.",
        "The proposed role focuses on explaining control decisions and documenting failure conditions in simulations. An illustrative review would compare strategies under shared assumptions rather than imply that a robot has been deployed safely in the world.",
      ],
      image: illustrations.robotics,
      isDemoContent: true,
    },
    {
      slug: "leena-vale",
      name: "Leena Vale",
      role: "Fictional sustainable engineering lead",
      departmentSlug: "sustainable-engineering",
      credentials: [],
      bio: [
        "Leena Vale is an invented department lead used only in this demonstration. The profile claims no real academic post, doctorate, sustainability certification or professional association membership.",
        "The illustrative role asks readers to make energy-model inputs and uncertainty explicit. Its sample project reviews compare assumptions and identify missing evidence without converting a model into a claim of measured environmental benefit.",
      ],
      image: illustrations.energy,
      isDemoContent: true,
    },
    {
      slug: "ari-fenwick",
      name: "Ari Fenwick",
      role: "Fictional materials and repair tutor",
      departmentSlug: "sustainable-engineering",
      credentials: [],
      bio: [
        "Ari Fenwick is a fictional character for a materials-focused profile. The teaching role is illustrative and does not identify a real employee, laboratory specialist, qualification holder or professional affiliate.",
        "The sample role considers how a product could be taken apart and what evidence supports a material choice. Suggested notebook questions distinguish verified properties from assumptions and leave unsupported impact figures out of the discussion.",
      ],
      image: illustrations.materials,
      isDemoContent: true,
    },
    {
      slug: "jules-hart",
      name: "Jules Hart",
      role: "Fictional design and human-centred technology lead",
      departmentSlug: "design-and-human-centred-technology",
      credentials: [],
      bio: [
        "Jules Hart is an invented design lead in the sample catalogue. This biography is not a real appointment, portfolio, academic credential, professional affiliation or account of work with actual clients.",
        "The illustrative role brings plain language and access needs into early design questions. A sample critique asks whether a task is understandable without relying on colour, pointer use or assumptions about a visitor's prior knowledge.",
      ],
      image: illustrations.interaction,
      isDemoContent: true,
    },
    {
      slug: "soren-bell",
      name: "Soren Bell",
      role: "Fictional product prototyping tutor",
      departmentSlug: "design-and-human-centred-technology",
      credentials: [],
      bio: [
        "Soren Bell is a fictional profile demonstrating a product prototyping tutor. The name, role and biography are invented; no actual employment, qualification, professional membership or commercially delivered project is asserted.",
        "The proposed role helps explain what a low-fidelity model can show and what requires another kind of test. Sample briefs connect drawings, assembly choices and repair access without suggesting that a working product has been produced.",
      ],
      image: illustrations.product,
      isDemoContent: true,
    },
  ],
  testimonials: [
    {
      id: "catalogue-comparison",
      quote:
        "Illustrative reflection: comparing the project questions would help me explain why I am interested in systems rather than choosing by a degree title alone.",
      authorName: "Rae Linden",
      authorRole: "Illustrative prospective student voice — fictional person, not an endorsement",
      isDemoContent: true,
    },
    {
      id: "evidence-notebook",
      quote:
        "Illustrative reflection: I would want my notebook to show what I assumed, what I checked and which question I still cannot answer.",
      authorName: "Kit Arden",
      authorRole:
        "Illustrative project participant voice — fictional person, not a reported experience",
      isDemoContent: true,
    },
    {
      id: "accessible-design",
      quote:
        "Illustrative reflection: starting a critique with keyboard flow and clear instructions would give me more useful questions than starting with decoration.",
      authorName: "Emery Wells",
      authorRole:
        "Illustrative design learner voice — fictional person, not a verified testimonial",
      isDemoContent: true,
    },
    {
      id: "study-questions",
      quote:
        "Illustrative reflection: I would take a shortlist of questions about teaching, costs and support to a verified provider before making a study decision.",
      authorName: "Robin Hale",
      authorRole: "Illustrative family member voice — fictional person, not a customer endorsement",
      isDemoContent: true,
    },
    {
      id: "portfolio-explanation",
      quote:
        "Illustrative reflection: a portfolio that explains my contribution and its limitations would be a better conversation starter than unsupported claims about results.",
      authorName: "Alex Marlow",
      authorRole: "Illustrative career explorer voice — fictional person, not a placement outcome",
      isDemoContent: true,
    },
  ],
  facilities: [
    {
      slug: "computing-systems-laboratory",
      name: "Computing systems laboratory — concept",
      summary:
        "An illustrative workspace for synthetic data, software tests and shared project reviews; not a real laboratory.",
      body: [
        "This fictional laboratory concept places individual coding work alongside a shared review table. It illustrates a space for explaining algorithms, data pipelines and reproducible tests, not premises, equipment inventory or access provided by Apex.",
        "A sample session could use invented records and isolated project examples to discuss how a change affects a system. The concept favours labelled instructions, readable screens and a quiet alternative to group discussion; these are design intentions, not verified facilities.",
        "There are no opening hours, bookings or device loans for this demonstration. A real provider would need to confirm accessible workstations, network rules, support arrangements and the suitability of software before any visit or practical session.",
      ],
      image: illustrations.systems,
      isDemoContent: true,
    },
    {
      slug: "electronics-and-robotics-laboratory",
      name: "Electronics and robotics laboratory — concept",
      summary:
        "A fictional laboratory layout connecting circuit models and simulation reviews; no actual equipment or supervised access is offered.",
      body: [
        "This demonstration concept separates a modelling area from an imagined supervised bench zone. The illustration is not a photograph or evidence that electronics, robotics hardware or specialist staff are available at a real site.",
        "Sample briefs explore sensor diagrams, component identification and simulation assumptions. Any physical activity would require equipment-specific induction, risk assessment and competent supervision; the website provides neither operating instructions nor permission to use machinery.",
        "A real laboratory description should explain access routes, emergency procedures, maintenance and booking eligibility. Those matters require confirmation by an actual operator rather than inference from the sample layout.",
      ],
      image: illustrations.electronics,
      isDemoContent: true,
    },
    {
      slug: "energy-and-materials-studio",
      name: "Energy and materials studio — concept",
      summary:
        "An illustrative setting for energy models and material-choice discussions, not a tested building or certified laboratory.",
      body: [
        "This fictional studio concept supports discussion of synthetic energy scenarios and repairable product sketches. It does not depict a real building, claim environmental performance or establish access to materials testing equipment.",
        "A sample project table could hold annotated drawings and a comparison of uncertain inputs. The editorial emphasis is on keeping assumptions visible, separating calculated estimates from measurements and asking what information would change a recommendation.",
        "The concept is not a venue for experiments or fabrication. A real operator must confirm safety, supervision, access and disposal arrangements before practical work, and must substantiate any claims about the environmental performance of its spaces.",
      ],
      image: illustrations.energy,
      isDemoContent: true,
    },
    {
      slug: "design-and-prototyping-studio",
      name: "Design and prototyping studio — concept",
      summary:
        "A fictional setting for paper prototypes, readable drawings and inclusive critiques; not a real studio or maker service.",
      body: [
        "This demonstration studio concept brings paper models, interface sketches and design journals into one illustrated workspace. It does not represent actual rooms, available tools, fabrication support or professional services.",
        "Suggested activities include tracing a task with keyboard-only assumptions, comparing assembly drawings and documenting what a non-functional model can reveal. Alternative presentation formats and clear critique prompts are design aims, not evidence of a completed access assessment.",
        "No studio sessions or machines can be booked here. Before using any real facility, confirm supervision, tool permissions, material restrictions and the arrangements for discussing access needs with its operator.",
      ],
      image: illustrations.product,
      isDemoContent: true,
    },
    {
      slug: "library-and-reading-room",
      name: "Library and reading room — concept",
      summary:
        "An illustrative resource space for quiet reading and source comparison; no collection size, subscriptions or lending service is claimed.",
      body: [
        "This fictional reading-room concept illustrates how a quieter setting could support technical study. The artwork is not a real library, and no book holdings, database subscriptions, staff service or physical access is represented.",
        "Sample study prompts ask readers to note a source's date, distinguish a design opinion from evidence and record where a quotation came from. A proposed resource guide would include readable formats and permission-aware reuse rather than assume all online material can be copied.",
        "There is no lending account, opening schedule or reading-room reservation on this site. A verified provider would need to confirm resource access, assistance and alternative formats before a student relies on them.",
      ],
      image: illustrations.library,
      isDemoContent: true,
    },
    {
      slug: "project-and-community-commons",
      name: "Project and community commons — concept",
      summary:
        "A fictional campus-life space for informal project discussion and shared planning; not actual premises or a support service.",
      body: [
        "This demonstration commons concept connects informal project conversation with individual planning space. It is an editorial illustration, not a photograph of a real campus, a record of community activities or a promise of accommodation or support.",
        "A sample gathering could compare project questions, practise explaining a diagram and agree how a group will credit contributions. Clear conduct expectations and alternatives to speaking in a large group would be useful planning considerations for an actual event.",
        "No meetings, room reservations or wellbeing appointments are available through this concept. Real visitors should obtain verified venue, access and support information from the organisation responsible for the activity.",
      ],
      image: illustrations.commons,
      isDemoContent: true,
    },
  ],
  faqs: [
    {
      id: "entry-requirements",
      category: "Study decisions",
      question: "Where can I find confirmed entry requirements?",
      answer: [
        "These are fictional pathway descriptions, not confirmed course offers. No entry requirements, fees or deadlines on this demonstration establish eligibility. Request approved details directly from a verified provider before making a real application.",
      ],
    },
    {
      id: "placement-year",
      category: "Career preparation",
      question: "Does a sample pathway include a guaranteed placement?",
      answer: [
        "No. Neither the four-year computing outline nor any other demonstration pathway includes a compulsory or guaranteed placement. The career preparation panels are illustrative project and portfolio prompts, not employer relationships, vacancies or reported employment outcomes.",
      ],
    },
    {
      id: "qualification-status",
      category: "Study decisions",
      question: "Are the BEng, MSc and other degree titles real qualifications?",
      answer: [
        "No. Degree-style names organise this sample catalogue only. Apex is a demonstration identity and does not award these qualifications or claim recognition for these pathways. Check the actual provider and awarding arrangements independently for any real course.",
      ],
    },
    {
      id: "compare-pathways",
      category: "Study planning",
      question: "How should I compare the sample pathways?",
      answer: [
        "Start with the project questions: building dependable software, interpreting measurements, comparing energy assumptions or designing understandable interactions. Use each description's three highlights to prepare questions, not to infer a confirmed syllabus or available timetable.",
      ],
    },
    {
      id: "fictional-people",
      category: "About the demonstration",
      question: "Are the people and quotations from a real institution?",
      answer: [
        "No. Every named profile is fictional, credentials are deliberately empty and testimonial roles identify their quotations as illustrative. The leadership message is written for this demonstration, not attributed to a real academic or customer.",
      ],
    },
    {
      id: "laboratory-visits",
      category: "Campus life",
      question: "Can I visit or book one of the laboratories?",
      answer: [
        "No. All six facilities are illustrated concepts rather than actual premises. There are no room bookings or supervised sessions on this site. Verify venue, access and safety information with a real operator before planning any visit.",
      ],
    },
    {
      id: "event-registration",
      category: "Events",
      question: "Can I register for the October, November or December entries?",
      answer: [
        "No. The future entries are fictional agendas used to demonstrate calendar grouping. The July and August entries are sample archives, not reports of delivered events. No ticket, booking, travel arrangement or attendance certificate is available.",
      ],
    },
    {
      id: "applications-and-personal-data",
      category: "Privacy and contact",
      question: "Can I submit an application or personal documents here?",
      answer: [
        "No application, enquiry or newsletter submission endpoint is configured for this demonstration. Email and telephone links open your own apps; they do not submit data through the website. The example contact details are not a verified office, so do not send identity documents, financial records or other sensitive information.",
      ],
    },
  ],
  policies: [
    {
      slug: "privacy",
      title: "Privacy notice — DEMO legal copy, not approved customer policy",
      updatedAt: "2026-09-09",
      body: [
        "DEMO LEGAL COPY — NOT APPROVED CUSTOMER POLICY. This notice describes the current Apex demonstration and identifies information a real operator must supply. It is not a legal review, an approved institutional notice or a substitute for advice about a particular deployment.",
        "Purpose and operator: this static website presents fictional study pathways, people and illustrated spaces. Apex is not a verified education provider or a named legal data controller. Before launch, the actual operator must publish its identity, jurisdiction and working privacy contact.",
        "Information sent by this application: no enquiry, application, booking or newsletter submission endpoint is configured. The pages do not accept admissions documents or payments. Do not enter or send personal records to demonstration contacts, and do not place API keys or other secrets in public content.",
        "Analytics and assets: the tenant's analytics provider is set to none. This demonstration does not configure analytics tracking or advertising pixels; fonts and illustrations are served locally with the static site. A later integration or host-injected script would require this description to be reassessed before activation.",
        "Hosting logs: requesting a static page still involves the hosting service and may create access or security logs containing an IP address, request time, requested URL, browser information and diagnostic details. The actual operator must identify its host, purposes, legal basis, recipients, retention and any international transfers rather than assume static means no processing.",
        "External communication: email and telephone links open your chosen application. Following a portal or social link leaves this site, and the destination's own practices apply. Sending an email would be handled by the sender's and recipient's services, not by a form backend supplied by this demonstration.",
        "Storage and retention: this notice does not invent a retention period for systems the demonstration does not operate. Before launch, the operator must document any browser storage, hosting logs, mailbox records and backups it actually uses, including deletion arrangements and access restrictions.",
        "Privacy rights and questions: applicable law may provide rights to access, correct, erase, restrict or object to processing, and sometimes portability or withdrawal of consent. Direct a request to the actual site operator through a verified contact. The example contact page is not a monitored privacy service or a named data protection officer, and no response deadline is promised here.",
        "Children and sensitive information: no student record service, identity verification or confidential support channel is provided. Avoid sending health, financial, identity or safeguarding details through example addresses. A real operator must establish appropriate channels and explain any age-related processing before collecting such information.",
        "Changes and review: these paragraphs reflect the demonstration configuration as dated above. Enabling forms, analytics, embedded media, accounts or another integration requires a fresh data-flow review and approved notice. The operator must also explain how unresolved concerns can reach the appropriate supervisory authority where applicable.",
      ],
    },
    {
      slug: "terms",
      title: "Website terms — DEMO legal copy, not approved customer policy",
      updatedAt: "2026-09-09",
      body: [
        "DEMO LEGAL COPY — NOT APPROVED CUSTOMER POLICY. These example terms explain the limits of the Apex demonstration. They have not been approved for a real operator, jurisdiction or customer and must be reviewed before any public service or contractual use.",
        "Demonstration purpose: this site illustrates an education-oriented website and editorial catalogue. Apex, its named people, pathways, calendar entries and facility descriptions are fictional. Nothing here constitutes an offer of admission, teaching, employment, accommodation or professional services.",
        "Qualifications and decisions: BEng, MSc, MEng, BDes and BSc labels describe sample pathways, not real awarded or recognised courses. Verify a real provider's identity, awarding arrangements, fees, entry criteria and current terms independently; do not use this demonstration as evidence of qualification status or eligibility.",
        "Enquiries and transactions: browsing a pathway or opening an email or phone link does not submit an application, reserve a place or create a booking. No payment or application processing service is supplied here. Example contact and portal details must not be treated as verified operational channels.",
        "Events and premises: calendar dates are illustrative, including the entries shown as past. They do not establish that an event occurred or will occur. Facility artwork is original demonstration illustration, not actual premises or people; do not arrange travel or equipment use on its basis.",
        "Content and reuse: text and original illustrations are supplied for this demonstration, while fonts and any separately licensed resources retain their own notices. Do not assume that every asset carries the same reuse permission. A real operator must publish appropriate ownership and licensing information before launch.",
        "Responsible use: do not attempt to disrupt the site, probe accounts without permission or send confidential information to demonstration addresses. Linked destinations are separate services and may have different terms. Verify the destination and its purpose before sharing information or relying on its content.",
        "Availability and correction: static pages can become outdated between deployments, and a sample date or description is not a delivery commitment. Report apparent errors to the actual operator through a verified channel. This draft does not invent a service level, response promise or limitation that removes non-excludable legal rights.",
        "Operator-specific terms: the real operator must identify itself and obtain review of governing law, dispute handling, accessibility, consumer rights and any contractual provisions relevant to its service. This demonstration does not select a court, impose an arbitration process or replace approved customer terms.",
      ],
    },
    {
      slug: "academic-integrity",
      title: "Academic integrity approach — DEMO policy, not approved customer policy",
      updatedAt: "2026-09-09",
      body: [
        "DEMO POLICY — NOT APPROVED CUSTOMER POLICY. This illustrative academic integrity approach accompanies fictional study content. No real enrolment, assessment regulations, disciplinary powers or qualification decisions are established by these paragraphs.",
        "Attribution: a sample project journal should distinguish an author's contribution from material drawn from another source. Record source details for quotations, diagrams, datasets and adapted code so a reader can understand what was created, borrowed or changed.",
        "Collaboration: agree how a demonstration group will divide work and acknowledge shared decisions. A real provider would need to define permitted collaboration for each assessment; this example does not assume that the same rule applies to every task.",
        "Data and evidence: label synthetic records, simulated results and assumptions clearly. Never present an invented observation, participant or measurement as evidence from a real study. Retain enough explanation for someone to understand how a sample conclusion was reached.",
        "Digital and AI tools: disclose assistance that materially contributes to a project and check generated statements, code and references. Do not upload confidential or personal data to an external tool without permission. Actual assessment rules and allowed tools must come from the verified provider.",
        "Questions and support: a reader who is unsure about attribution or collaboration should seek clarification before submitting work in a real course. The demonstration has no submission service or academic adviser; an actual operator must publish accessible guidance and working support contacts.",
        "Concerns and review: a real process should explain the concern, give the person a fair opportunity to respond and distinguish error from deliberate misrepresentation. This sample imposes no penalty, finding or appeal deadline and does not promise a particular investigation outcome.",
        "Approval and records: before adopting a policy, the actual provider must specify decision-makers, evidence handling, proportionate responses, confidentiality, retention and an independent review route where appropriate. Publish approved rules with a review date rather than treating this demonstration as operative regulations.",
      ],
    },
    {
      slug: "accessibility",
      title: "Accessibility approach — DEMO policy, not approved customer policy",
      updatedAt: "2026-09-09",
      body: [
        "DEMO POLICY — NOT APPROVED CUSTOMER POLICY. This draft describes the intended access approach for the Apex demonstration. It is not an independently certified conformance statement or an approved commitment by a real institution.",
        "Design intent: the shared site aims to support keyboard navigation, visible focus, readable text and structured headings. These intentions do not mean that every device, assistive technology or future content change has been tested, and they do not establish universal accessibility.",
        "Reading and navigation: content is supplied as selectable text rather than text embedded in artwork. Use your browser's text and zoom controls as needed. If a heading, link label or reading order is unclear, a useful report identifies the affected page and the task you were trying to complete.",
        "Images and motion: local artwork is explicitly described as demonstration illustration rather than real people or premises. The application is designed to respect a user's reduced-motion preference. A real operator must review alternative text and interaction behaviour whenever content or media changes.",
        "Documents: downloadable demonstration materials are not approved prospectuses or policies. A real operator must assess each document's structure, reading order and usable alternatives, rather than assume that offering a file also makes its content accessible.",
        "Known limits: third-party portal and social destinations are outside this site's implementation. The sample facilities are not evidence of accessible physical premises. Verify the access arrangements of any actual location or external service directly with its responsible operator.",
        "Reporting a barrier: contact the actual operator through a verified channel and describe the page, task, browser or assistive technology if you are comfortable sharing it. Request an alternative format where helpful. The example contact details do not constitute a monitored accessibility desk or a promised response time.",
        "Review before launch: a real deployment needs testing with relevant users and technologies, a documented list of known issues and an accountable improvement process. The operator must approve its statement, publish current contact and escalation details and review it after significant changes.",
      ],
    },
    {
      slug: "complaints",
      title: "Feedback and complaints approach — DEMO policy, not approved customer policy",
      updatedAt: "2026-09-09",
      body: [
        "DEMO POLICY — NOT APPROVED CUSTOMER POLICY. This illustrative process explains what a real operator should clarify when publishing a complaints route. It is not an active case-handling service, an institutional procedure or legal advice.",
        "Scope: distinguish a content correction, an access barrier and a complaint about a real service. The demonstration offers no teaching, placements or bookings, so its sample pages cannot establish the terms of a service someone has actually received elsewhere.",
        "Initial contact: use a verified contact for the organisation responsible for the issue. State what happened, when it occurred and what resolution you are seeking. The Apex example addresses are not a monitored complaints office and should not receive sensitive case material.",
        "Information handling: provide only the information needed to explain the concern. Avoid sending identity documents, medical information or another person's records unless a real operator has explained a lawful need and a secure channel. Keep your own copy of relevant correspondence.",
        "Acknowledgement and review: an actual operator should explain who will review the concern, how conflicts of interest are handled and what timetable applies. This draft does not invent a reply deadline, a staff appointment or a guarantee that a particular remedy will be available.",
        "Fair consideration: a real process should consider relevant evidence, allow clarification and give understandable reasons for its decision. Request an accessible format or communication adjustment where needed. No adverse finding, compensation decision or disciplinary action is made through this demonstration.",
        "Escalation: if a real concern remains unresolved, ask the responsible operator for its approved review route and any applicable independent body. This draft does not claim affiliation with an ombudsman or replace statutory rights, legal remedies or emergency assistance.",
        "Records and improvement: before adoption, the actual operator must define confidentiality, access to case records, retention, accountable decision-makers and how recurring concerns inform changes. Publish an approved policy and working contacts rather than relying on this example as an operational commitment.",
      ],
    },
  ],
  stats: [
    {
      id: "sample-pathways",
      label: "Pathway examples in this catalogue",
      value: "8",
      caption: "Counts demonstration entries, not real courses or qualifications.",
      isDemoContent: true,
    },
    {
      id: "sample-departments",
      label: "Fictional department profiles",
      value: "4",
      caption: "Counts catalogue groupings, not the size of an institution.",
      isDemoContent: true,
    },
    {
      id: "sample-space-concepts",
      label: "Illustrated space concepts",
      value: "6",
      caption: "Counts sample facility descriptions, not actual buildings or laboratories.",
      isDemoContent: true,
    },
  ],
} satisfies Omit<TenantContentInput, "gallery" | "downloads" | "pageSections">;
