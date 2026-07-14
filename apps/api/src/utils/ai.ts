import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client safely
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ─── Context-Aware Safety Check ──────────────────────────────────────────────
// Instead of naive keyword matching (which flags "Ramesh wanted to cheat" in a
// word problem), we use Gemini to understand the *intent* of the prompt.

export interface SafetyCheckResult {
  isCriticalSafety: boolean;
  isCheating: boolean;
  reason: string;
}

/**
 * Checks whether a student prompt is genuinely harmful/violating policy,
 * using AI-powered intent analysis rather than simple keyword matching.
 * This prevents false positives like word problems that mention "cheat" or
 * story contexts that contain flagged vocabulary.
 */
export async function checkPromptSafety(
  prompt: string,
): Promise<SafetyCheckResult> {
  const lowerPrompt = prompt.toLowerCase().trim();

  // Step 1: Hard-block — phrases that are NEVER legitimate academic content.
  // Covers both critical safety and direct first-person cheating intent.
  const HARD_BLOCK_PHRASES: Array<{
    phrase: string;
    type: "safety" | "cheating";
  }> = [
    // Critical safety
    { phrase: "how to make a bomb", type: "safety" },
    { phrase: "how to make bomb", type: "safety" },
    { phrase: "buy drugs online", type: "safety" },
    { phrase: "how to buy drugs", type: "safety" },
    { phrase: "kill myself", type: "safety" },
    { phrase: "i want to die", type: "safety" },
    { phrase: "help me self harm", type: "safety" },
    { phrase: "how to self harm", type: "safety" },
    { phrase: "suicide method", type: "safety" },
    { phrase: "how do i commit suicide", type: "safety" },
    // Direct first-person cheating intent — these cannot appear in a word problem
    // because they are first-person expressions of desire/need, not narrative descriptions.
    { phrase: "i wanna cheat", type: "cheating" },
    { phrase: "i want to cheat", type: "cheating" },
    { phrase: "i need to cheat", type: "cheating" },
    { phrase: "i'm going to cheat", type: "cheating" },
    { phrase: "im going to cheat", type: "cheating" },
    { phrase: "let me cheat", type: "cheating" },
    { phrase: "help me cheat", type: "cheating" },
    { phrase: "how do i cheat", type: "cheating" },
    { phrase: "how can i cheat", type: "cheating" },
    { phrase: "how to cheat on", type: "cheating" },
    { phrase: "cheat on my exam", type: "cheating" },
    { phrase: "cheat on my test", type: "cheating" },
    { phrase: "cheat on my homework", type: "cheating" },
    { phrase: "bypass school filter", type: "cheating" },
    { phrase: "bypass internet filter", type: "cheating" },
    { phrase: "bypass content filter", type: "cheating" },
    { phrase: "get exam answers", type: "cheating" },
    { phrase: "give me the answers to", type: "cheating" },
    { phrase: "do my homework for me", type: "cheating" },
    { phrase: "write my essay for me", type: "cheating" },
    { phrase: "how to plagiarize", type: "cheating" },
  ];

  for (const { phrase, type } of HARD_BLOCK_PHRASES) {
    if (lowerPrompt.includes(phrase)) {
      return {
        isCriticalSafety: type === "safety",
        isCheating: type === "cheating",
        reason: `Hard-blocked phrase detected: "${phrase}"`,
      };
    }
  }

  // Step 2: AI-powered contextual intent analysis via Gemini.
  // Only runs for prompts that passed the hard-block check above.
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const classifierPrompt = `You are a strict school content moderation assistant for a student learning platform (ages 12–18).

Analyze the following student prompt and determine if it violates school policy.

VIOLATION = flag as true when the student is:
- Directly expressing personal intent to cheat ("I wanna cheat", "I need to cheat")
- Requesting help to cheat, plagiarize, or commit academic dishonesty
- Asking how to bypass school systems, filters, or restrictions
- Requesting content that could cause real physical harm

NOT A VIOLATION = keep both flags false when the prompt is:
- A word problem or story that MENTIONS cheating/harm (e.g. "Ramesh wanted to cheat — if he cheats 3 times...")
- An essay or academic discussion about cheating/drugs/violence as a topic
- A history, literature, or science question that references harmful events/things
- Any question where the student is studying cheating/harm rather than committing it

Key distinction: "Ramesh wanted to cheat" (third person narrative) = NOT a violation.
"I wanna cheat" or "help me cheat" (first person intent) = VIOLATION.

Student Prompt: "${prompt.replace(/"/g, "'")}"

Respond ONLY with valid JSON, no markdown, no explanation:
{"isCriticalSafety": false, "isCheating": false, "reason": "brief reason"}`;

      const result = await model.generateContent(classifierPrompt);
      const text = result.response.text().trim();

      // Strip markdown code fences if present
      const jsonText = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed = JSON.parse(jsonText) as SafetyCheckResult;

      return {
        isCriticalSafety: Boolean(parsed.isCriticalSafety),
        isCheating: Boolean(parsed.isCheating),
        reason: parsed.reason || "AI classification",
      };
    } catch {
      // Fall through to conservative fallback
    }
  }

  // Step 3: Conservative fallback when AI is unavailable.
  // Only matches explicit multi-word cheating intent phrases to avoid false positives.
  const FALLBACK_CHEATING_PHRASES = [
    "wanna cheat",
    "want to cheat",
    "need to cheat",
    "going to cheat",
    "gonna cheat",
    "help me cheat",
    "how to cheat",
    "how do i cheat",
    "how can i cheat",
    "cheat on my",
    "do my homework for me",
    "write my essay for me",
    "bypass school filter",
    "bypass internet restriction",
    "bypass content filter",
    "get exam answers",
    "get test answers",
    "give me the answers to",
    "plagiarize this",
    "how to plagiarize",
  ];

  const FALLBACK_SAFETY_PHRASES = [
    "suicide",
    "self-harm",
    "harm myself",
    "make a bomb",
    "build a weapon",
    "buy drugs",
  ];

  const isCheating = FALLBACK_CHEATING_PHRASES.some((p) =>
    lowerPrompt.includes(p),
  );
  const isCriticalSafety = FALLBACK_SAFETY_PHRASES.some((p) =>
    lowerPrompt.includes(p),
  );

  return {
    isCriticalSafety,
    isCheating,
    reason:
      isCriticalSafety || isCheating
        ? "Matched fallback phrase filter"
        : "No violation detected",
  };
}

interface AskAiOptions {
  prompt: string;
  gradeLevel: number;
  subject?: string;
  topic?: string;
  toolName?: string;
}

export async function askAI({
  prompt,
  gradeLevel,
  subject = "General",
  topic = "Study Guide",
  toolName = "AI Assistant",
}: AskAiOptions): Promise<string> {
  // Cap the grade level at 8 since this is a platform for kids aged 5-12 (Grades 1-8)
  const normalizedGrade = Math.min(8, gradeLevel || 5);

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      let systemPrompt = "";
      if (normalizedGrade >= 1 && normalizedGrade <= 5) {
        systemPrompt = `You are a friendly, encouraging, and bubbly AI tutor for young children (ages 5-10, grade level 1 to 5). 
Explain the following question/query using very simple terms, cute analogies, plentiful colorful emojis, and highly encouraging, positive feedback.
Avoid complex academic jargon. Keep sentences short.
Query: "${prompt}"
Subject: "${subject}"
Topic: "${topic}"
AI Assistant Name/Context: "${toolName}"`;
      } else if (normalizedGrade >= 6 && normalizedGrade <= 8) {
        systemPrompt = `You are a supportive, friendly, and structured AI learning companion for middle schoolers (ages 11-14, grade level 6 to 8). 
Explain the following concept or query in an engaging, structured way. 
Use clear sections, bullet points, and practical everyday examples. 
Include a small section called "💡 Quick Study Tip" to help them remember or learn this topic.
Query: "${prompt}"
Subject: "${subject}"
Topic: "${topic}"
AI Assistant Name/Context: "${toolName}"`;
      } else {
        systemPrompt = `You are an expert academic AI tutor for high school and university students (grade level 9+). 
Provide a comprehensive, high-quality, technically accurate, and structured explanation of the concept or query.
Output your response formatted in Markdown with the following exact structure:
#### Technical Explanation & Analysis
**Subject**: ${subject}
**Query Context**: "${prompt}" via ${toolName}

**Abstract**: [1-2 sentences summarizing the core concept]
- **Methodology**: [Bullet points explaining the technical explanation, logic flow, or steps]
- **Application**: [How this concept is applied in real life, science, code, or academics]
- **Reference**: [Cross-reference standard academic textbooks, resources, or code docs for verification]`;
      }

      const result = await model.generateContent(systemPrompt);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      console.error("Gemini API Error, falling back to smart generator:", err);
    }
  }

  // Fallback to local smart generator if API Key is missing or request fails
  return generateSmartFallback(
    prompt,
    normalizedGrade,
    toolName,
    subject,
    topic,
  );
}

function generateSmartFallback(
  prompt: string,
  gradeLevel: number,
  toolName: string,
  subject: string,
  topic: string,
): string {
  const lowerPrompt = prompt.toLowerCase();

  // Topic matching database
  let matchedConcept: {
    title: string;
    explanation: string;
    steps: string[];
    tip: string;
    abstract: string;
    methodology: string[];
    application: string;
    reference: string;
  } | null = null;

  if (
    lowerPrompt.includes("photosynthesis") ||
    lowerPrompt.includes("plant") ||
    lowerPrompt.includes("leaf")
  ) {
    matchedConcept = {
      title: "Photosynthesis (Converting Sunlight to Energy)",
      explanation:
        "Photosynthesis is the magical way plants cook their own food using sunshine, air (carbon dioxide), and water from the soil!",
      steps: [
        "Absorption: Leaves trap sunlight using a green pigment called chlorophyll.",
        "Input: The plant drinks water through its roots and breathes in carbon dioxide gas from the air.",
        "Chemical Reaction: Sunlight transforms the water and carbon dioxide into sugars (food) and oxygen gas.",
        "Output: The plant stores the sugars for energy and releases clean oxygen back into the air for humans and animals to breathe.",
      ],
      tip: "Remember: Plants breathe in carbon dioxide and release oxygen. Humans breathe in oxygen and release carbon dioxide. We are perfect partners!",
      abstract:
        "Photosynthesis is the biochemical process by which photoautotrophic organisms (e.g. green plants, algae) convert light energy into chemical energy in the form of glucose.",
      methodology: [
        "Light reactions capture photons in thylakoid membranes to generate ATP and NADPH.",
        "Light-independent reactions (Calvin Cycle) in the stroma fix carbon dioxide into G3P (sugars).",
        "Equation: 6CO2 + 6H2O + Light -> C6H12O6 + 6O2",
      ],
      application:
        "Photosynthesis is the foundation of Earth's food chain and the primary source of atmospheric oxygen, driving ecological stability and agricultural production.",
      reference:
        "Campbell Biology (12th Edition), Chapter 10: Photosynthesis; Nelson Plant Biology Systems.",
    };
  } else if (
    lowerPrompt.includes("mitosis") ||
    lowerPrompt.includes("meiosis") ||
    lowerPrompt.includes("cell")
  ) {
    matchedConcept = {
      title: "Cell Division (Mitosis vs Meiosis)",
      explanation:
        "Mitosis is how body cells duplicate to help you grow or heal. Meiosis is how reproductive cells are made with half the genetic material.",
      steps: [
        "Mitosis duplicates one parent cell into two identical daughter cells (diploid).",
        "Meiosis divides a cell into four unique cells with half the chromosomes (haploid).",
        "Mitosis is for growth/tissue repair; Meiosis is for sexual reproduction.",
      ],
      tip: "Mitosis sounds like 'My-Toes' (which are body parts that grow!). Meiosis makes gametes (sperm and egg cells).",
      abstract:
        "Mitosis produces genetically identical somatic cells, whereas meiosis reduces chromosome ploidy by half to form gametes, introducing genetic diversity through crossing over.",
      methodology: [
        "Mitosis stages: Prophase, Metaphase, Anaphase, Telophase (PMAT) resulting in 2n -> 2n.",
        "Meiosis stages: Two sequential cycles of PMAT (Meiosis I and II) resulting in 2n -> 1n.",
        "Recombination occurs during Prophase I of meiosis, facilitating evolutionary adaptation.",
      ],
      application:
        "Understanding mitosis explains tissue regeneration and oncology (uncontrolled mitosis), while meiosis explains inheritance patterns and congenital genetics.",
      reference:
        "Lodish Molecular Cell Biology (9th Edition); Lodish, Berk, Kaiser.",
    };
  } else if (
    lowerPrompt.includes("atom") ||
    lowerPrompt.includes("proton") ||
    lowerPrompt.includes("electron") ||
    lowerPrompt.includes("neutron")
  ) {
    matchedConcept = {
      title: "Atomic Structure (Protons, Neutrons & Electrons)",
      explanation:
        "Atoms are the tiny puzzle pieces that make up everything in the universe! They have a heavy center called the nucleus and tiny particles orbiting it.",
      steps: [
        "Protons: Positively charged particles in the center (nucleus). They decide what element the atom is.",
        "Neutrons: Neutral particles in the nucleus that keep it stable.",
        "Electrons: Negatively charged lightweight particles that spin around the nucleus like planets orbiting the sun.",
      ],
      tip: "Proton starts with P for Positive. Neutron starts with N for Neutral. Electron is Negative!",
      abstract:
        "An atom is the basic unit of a chemical element, consisting of a dense, positively charged nucleus surrounded by an electron cloud occupying quantized energy shells.",
      methodology: [
        "Nucleus holds protons (p+) and neutrons (n0), accounting for almost all atomic mass.",
        "Electrons (e-) occupy orbital probability distributions defined by Schrodinger's wave equations.",
        "Atomic number equals proton count; mass number equals protons plus neutrons.",
      ],
      application:
        "Atomic structure determines chemical reactivity, molecular bonding (ionic, covalent), and quantum mechanical technologies such as semiconductors and lasers.",
      reference:
        "Halliday & Resnick Fundamentals of Physics; Bohr Model and Quantum Mechanics Foundations.",
    };
  } else if (
    lowerPrompt.includes("quadratic") ||
    lowerPrompt.includes("formula") ||
    lowerPrompt.includes("equation")
  ) {
    matchedConcept = {
      title: "The Quadratic Formula",
      explanation:
        "The quadratic formula ($x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$) is a math key that unlocks the exact spots where a curved, U-shaped line (parabola) crosses the ground!",
      steps: [
        "Standard Form: Make sure your equation looks like ax² + bx + c = 0.",
        "Identify variables: Find the numbers for a, b, and c.",
        "Substitute: Plug them into the quadratic formula to solve for the two possible answers (x).",
      ],
      tip: "The part inside the square root ($b^2 - 4ac$) is called the discriminant. If it is negative, the curve never crosses the ground!",
      abstract:
        "The quadratic formula provides the algebraic solutions to a second-degree polynomial equation ax² + bx + c = 0, where a is non-zero.",
      methodology: [
        "Derived by completing the square on the general quadratic equation ax² + bx + c = 0.",
        "Solutions are given by x = (-b ± sqrt(b² - 4ac)) / (2a).",
        "Discriminant (D = b² - 4ac) dictates real or complex conjugate roots.",
      ],
      application:
        "Quadratic equations model trajectories (ballistics, sports), optimization problems in economics, and structural design calculations in civil engineering.",
      reference:
        "Larson College Algebra (11th Edition); Stewart Calculus: Early Transcendentals.",
    };
  } else if (
    lowerPrompt.includes("binary search") ||
    lowerPrompt.includes("search") ||
    lowerPrompt.includes("algorithm")
  ) {
    matchedConcept = {
      title: "Binary Search Algorithm",
      explanation:
        "Binary search is a super-fast way to find a target item in a sorted list by cutting the search area in half every single step!",
      steps: [
        "Prerequisite: The list must be sorted in order (like alphabetical or smallest to largest).",
        "Step 1: Check the middle item of the list.",
        "Step 2: If the target is smaller, repeat the search on the left half. If larger, search the right half.",
        "Repeat: Continue dividing in half until you find the item or run out of list.",
      ],
      tip: "If you guess a number between 1 and 100, guessing 50 first is binary search! It reduces your search size to 50 in just one guess.",
      abstract:
        "Binary search is an efficient search algorithm that finds the position of a target value within a sorted array in logarithmic time complexity, O(log n).",
      methodology: [
        "Initialize low = 0 and high = n - 1.",
        "Calculate mid = low + (high - low) / 2 to avoid integer overflow.",
        "Compare array[mid] to target; adjust low or high indexes recursively or iteratively.",
      ],
      application:
        "Highly utilized in database indexing, system library lookups, and routing tables where rapid retrieval of sorted data is critical.",
      reference:
        "Introduction to Algorithms (CLRS), Chapter 12: Binary Search Trees & Divide and Conquer.",
    };
  }

  // Fallback if no specific concept matches, generate a dynamic response based on query words
  if (!matchedConcept) {
    const formattedTopic = topic || "Study Concept";
    const cleanedPrompt = prompt.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const words = cleanedPrompt.split(" ").filter((w) => w.length > 4);
    const keywordsUsed = words.slice(0, 3).join(", ") || "academic principles";

    matchedConcept = {
      title: `${formattedTopic} Breakdown`,
      explanation: `Let's break down your question about "${prompt}"! Learning new things expands your brain capacity!`,
      steps: [
        `Understand the Core Question: You asked about "${keywordsUsed}". We analyze this step-by-step.`,
        `Apply Logical Reasoning: Investigate key concepts, terminology, and patterns relating to this subject.`,
        `Synthesize Knowledge: Link this new concept with elements you've already learned in ${subject}.`,
      ],
      tip: `Always try to explain what you've learned to a friend or family member. Teaching others is the best way to make the knowledge stick!`,
      abstract: `The query concerning "${prompt}" involves analyzing fundamental definitions, parameters, and applications within ${subject}.`,
      methodology: [
        `Parse the semantic parameters of "${keywordsUsed}"`,
        `Examine basic tenets and underlying axioms of ${subject}`,
        `Synthesize a structured explanation matching academic standards`,
      ],
      application: `Helps build critical analytical thinking and provides empirical context for studying ${formattedTopic}.`,
      reference: `Standard Educational Curriculum & Reference Materials for ${subject}.`,
    };
  }

  // Render based on gradeLevel
  if (gradeLevel >= 1 && gradeLevel <= 5) {
    return (
      `⭐ **HELLO ADVENTURER!** ⭐ Let's explore **${matchedConcept.title}** together! 🎈\n\n` +
      `✨ **What is it?**\n` +
      `${matchedConcept.explanation}\n\n` +
      `🌈 **How it works step-by-step:**\n` +
      matchedConcept.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n") +
      `\n\n` +
      `🥳 **Volt Bot's Encouragement:** You are doing a fantastic job learning new things today! Keep up the brilliant discovery work! 🌟✨`
    );
  } else if (gradeLevel >= 6 && gradeLevel <= 8) {
    return (
      `### 💡 Study Guide: ${matchedConcept.title}\n\n` +
      `Here is a clean breakdown of your query about "${prompt}" using ${toolName}:\n\n` +
      `#### 📌 Explanation\n` +
      `${matchedConcept.explanation}\n\n` +
      `#### ⚙️ Key Steps & Mechanics\n` +
      matchedConcept.steps.map((s) => `- ${s}`).join("\n") +
      `\n\n` +
      `#### 💡 Quick Study Tip\n` +
      `${matchedConcept.tip}`
    );
  } else {
    return (
      `#### Technical Explanation & Analysis\n\n` +
      `**Subject**: ${subject}\n` +
      `**Query Context**: "${prompt}" via ${toolName}\n\n` +
      `**Abstract**: ${matchedConcept.abstract}\n\n` +
      `- **Methodology**:\n` +
      matchedConcept.methodology.map((m) => `  - ${m}`).join("\n") +
      `\n` +
      `- **Application**: ${matchedConcept.application}\n` +
      `- **Reference**: ${matchedConcept.reference}`
    );
  }
}
