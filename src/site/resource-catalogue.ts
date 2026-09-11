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
    "An illustrative rising-line chart — not real statistics",
  ],
  documents: [
    {
      id: "program-comparison",
      category: "Planning",
      title: "Sample programme comparison workbook",
      description:
        "Compare demonstration study routes without implying recognised awards or available places.",
      sections: [
        {
          heading: "Compare substance, not labels",
          paragraphs: [
            "Select two fictional programmes and compare their subject focus, sample project work and stated learning activities. Distinguish a topic you would explore from a qualification a real institution is authorised to award.",
            "Ask an actual provider for approved curriculum, assessment, entry criteria and recognition information. Apex's sample degree-style titles establish none of these facts.",
          ],
        },
        {
          heading: "Build a question list",
          paragraphs: [
            "Consider access to teaching, equipment, supervision and feedback. Check which commitments depend on timetable, capacity or additional costs rather than assuming the illustrated laboratory is a real facility.",
            "Use a verified admissions route for current answers. This document collects no application data and offers no enrollment or employment guarantee.",
          ],
        },
      ],
    },
    {
      id: "project-brief",
      category: "Learning",
      title: "Sample technical project brief",
      description:
        "A structured practice brief for a hypothetical engineering or computing project.",
      sections: [
        {
          heading: "Define the question",
          paragraphs: [
            "State a small technical question, the assumptions behind it and what evidence would help evaluate an approach. Use synthetic or openly permitted data rather than personal, commercial or confidential records.",
            "Describe the proposed artifact, constraints and a simple comparison method. Keep observations separate from conclusions, and record unsuccessful attempts as part of the reasoning.",
          ],
        },
        {
          heading: "Review responsibly",
          paragraphs: [
            "A real project may need ethics, safety, data-use or equipment approval. This demonstration is not permission to run experiments, access systems or use laboratory machinery.",
            "Identify who would review the brief and what would stop the work. No research partnership, validated result or published study is implied by this sample.",
          ],
        },
      ],
    },
    {
      id: "laboratory-visit",
      category: "Participation",
      title: "Sample laboratory visit questions",
      description:
        "Prepare a supervised discussion; not a laboratory safety manual or access permit.",
      sections: [
        {
          heading: "Ask about supervision",
          paragraphs: [
            "Discuss induction, permitted activities, supervision and how equipment use is authorised. Request the real laboratory's safety instructions; the original illustrations do not depict inspected premises.",
            "Ask what can be observed without handling equipment and who can answer access questions. Do not arrive at a demonstration address or assume the sample facilities are operating.",
          ],
        },
        {
          heading: "Understand the working environment",
          paragraphs: [
            "Confirm practical access, emergency procedures and the process for raising concerns with the actual operator. Do not use this fictional catalogue as evidence of compliance or availability.",
            "This question sheet does not replace training, risk assessment or professional guidance. Follow the verified institution's approved instructions.",
          ],
        },
      ],
    },
    {
      id: "career-reflection",
      category: "Career preparation",
      title: "Sample career preparation worksheet",
      description:
        "Reflect on skills and portfolio evidence without promising placements or employment.",
      sections: [
        {
          heading: "Describe your contribution",
          paragraphs: [
            "Choose a practice project and explain the question, your contribution and what changed after feedback. Show reasoning and limitations rather than inflating an outcome or claiming work by another person.",
            "Use synthetic examples and remove sensitive information before sharing a portfolio. The demonstration offers no recruiter introductions, placement rates or employer endorsement.",
          ],
        },
        {
          heading: "Plan the next conversation",
          paragraphs: [
            "Prepare questions about role expectations, learning opportunities and the evidence an employer would find useful. Confirm any real career service independently.",
            "A completed worksheet is a reflection artifact, not a qualification or a job application. No employment outcome is guaranteed.",
          ],
        },
      ],
    },
    {
      id: "study-access",
      category: "Participation",
      title: "Sample study and access planning guide",
      description: "Questions about teaching formats, materials and support for a real provider.",
      sections: [
        {
          heading: "Make study needs discussable",
          paragraphs: [
            "Ask how materials are provided, how technical demonstrations are explained and what alternatives exist when a format is difficult to use. Describe the access issue without placing sensitive records in the sample.",
            "Discuss deadlines, feedback channels and how project work is supervised. Actual adjustments depend on the verified operator's assessment and approved arrangements.",
          ],
        },
        {
          heading: "Confirm the responsible contact",
          paragraphs: [
            "The example email and portal links are not a student-support service. Use a real institution's published route for access, welfare, academic or privacy concerns.",
            "This demonstration guide is not an approved support policy, accreditation claim or statement of entitlement. Replace it with reviewed material before a customer launch.",
          ],
        },
      ],
    },
  ],
};
