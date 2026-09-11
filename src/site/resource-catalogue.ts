export interface DemoDocument {
  id: string;
  category: string;
  title: string;
  description: string;
  sections: { heading: string; paragraphs: string[] }[];
}
export interface DemoResourceCatalogue {
  name: string;
  gallery: string[];
  documents: DemoDocument[];
}

export const apexResources: DemoResourceCatalogue = {
  name: "Apex Institute of Technology",
  gallery: [
    "Technical reading",
    "Geometric patterns with circles, squares and triangles",
    "A botanical study of plant leaves and a stem",
    "A folded paper design model",
    "Project discussion in two speech bubbles",
    "Sound study with musical notes and waves",
    "A lined experimental notebook and pencil",
    "Investigation with a magnifying glass",
    "A cube-shaped structural model",
    "Two linked computing screens",
    "Research dialogue in abstract curves and circles",
    "Student research and data trajectory",
  ],
  documents: [
    {
      id: "program-comparison",
      category: "Academic Planning",
      title: "Undergraduate & Postgraduate Programme Guide",
      description:
        "Comprehensive guide to degree routes, research specialisms, and practical engineering curricula.",
      sections: [
        {
          heading: "Comparing Academic Pathways",
          paragraphs: [
            "Select your intended engineering or computing pathway and review module progression, laboratory commitments, and capstone project options. Each pathway combines theoretical principles with rigorous practical coursework.",
            "Contact our academic registry for detailed course specifications, assessment schedules, entry prerequisites, and professional accreditation details.",
          ],
        },
        {
          heading: "Key Consideration Points",
          paragraphs: [
            "Consider access to specialist laboratory suites, faculty mentorship, computing clusters, and collaborative workshop facilities.",
            "Our admissions advisors are available to discuss entry qualifications, international equivalencies, and optional industrial placement years.",
          ],
        },
      ],
    },
    {
      id: "project-brief",
      category: "Engineering Practice",
      title: "Engineering Project Framework & Brief",
      description:
        "Standard guidelines and criteria for technical design, prototyping, and project review.",
      sections: [
        {
          heading: "Project Definition and Scope",
          paragraphs: [
            "Define your technical hypothesis, engineering constraints, and verification methodology. Use verified data sources and maintain clear separation between observed metrics and analytical models.",
            "Document hardware schematics, algorithm architectures, and experimental iterations in your project notebook, logging all test outcomes and design adjustments.",
          ],
        },
        {
          heading: "Safety and Technical Review",
          paragraphs: [
            "All practical engineering projects must undergo laboratory safety review and ethical clearance where applicable before physical prototyping begins.",
            "Faculty tutors conduct regular milestone reviews to evaluate progress, code hygiene, circuit safety, and compliance with technical standards.",
          ],
        },
      ],
    },
    {
      id: "laboratory-visit",
      category: "Campus & Labs",
      title: "Laboratory & Research Facility Guide",
      description:
        "Safety procedures, equipment access protocols, and induction guidelines for engineering studios.",
      sections: [
        {
          heading: "Laboratory Induction and Access",
          paragraphs: [
            "All students and researchers must complete mandatory safety inductions prior to utilizing specialized fabrication equipment, laser cutters, or high-voltage test benches.",
            "Qualified laboratory technicians oversee equipment booking, maintenance schedules, and personal protective equipment protocols across all departmental facilities.",
          ],
        },
        {
          heading: "Safe Working Practices",
          paragraphs: [
            "Familiarize yourself with laboratory evacuation routes, emergency shut-off switches, and chemical handling protocols detailed in each studio manual.",
            "Report any damaged equipment or technical anomalies immediately to the laboratory manager on duty.",
          ],
        },
      ],
    },
    {
      id: "career-reflection",
      category: "Career & Industry",
      title: "Career & Professional Development Handbook",
      description:
        "Industry placement frameworks, portfolio building, and career mentorship opportunities.",
      sections: [
        {
          heading: "Building an Evidence-Led Portfolio",
          paragraphs: [
            "Document your engineering project contributions with clarity, highlighting technical challenges overcome, architectural decisions made, and reproducible results.",
            "Focus on demonstrating your problem-solving process, version-control discipline, and ability to communicate complex engineering ideas effectively.",
          ],
        },
        {
          heading: "Industry Connections & Placements",
          paragraphs: [
            "Engage with our career development team for one-on-one CV clinics, technical mock interviews, and access to exclusive employer networking forums.",
            "Our corporate partnerships network connects students with leading technology companies for summer internships and year-long industrial placements.",
          ],
        },
      ],
    },
    {
      id: "study-access",
      category: "Student Support",
      title: "Academic Support & Accessibility Guide",
      description:
        "Inclusive learning adjustments, technical accommodations, and student wellbeing resources.",
      sections: [
        {
          heading: "Accessible Learning Support",
          paragraphs: [
            "Apex Institute of Technology is dedicated to providing an inclusive learning environment. We offer tailored adjustments including assistive technologies, extended library access, and specialized laboratory equipment.",
            "Students are encouraged to discuss individual access requirements with our student wellbeing team to establish a personalized academic support plan.",
          ],
        },
        {
          heading: "Support Contacts and Resources",
          paragraphs: [
            "Our academic advisors, peer mentors, and specialist wellbeing tutors provide comprehensive support throughout your academic journey.",
            "Confidential consultations can be booked through the student services portal or by visiting the Student Hub on the main campus.",
          ],
        },
      ],
    },
  ],
};
