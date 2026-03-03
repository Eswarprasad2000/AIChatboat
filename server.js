require("dotenv").config();
const express = require("express");
const Groq = require("groq-sdk");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GROQ_API_KEY) {
  console.error("ERROR: GROQ_API_KEY is missing in your .env file.");
  console.error("Get a free key at: https://console.groq.com/");
  process.exit(1);
}

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Role system prompts ────────────────────────────────────────────────────
const ROLES = {
  assistant: {
    name: "AI Assistant",
    system:
      "You are a helpful, knowledgeable, and friendly AI assistant. " +
      "Always provide accurate, fact-based, and clear responses. " +
      "If you are unsure about something, say so honestly. " +
      "Keep answers well-structured and easy to understand.",
  },
  doctor: {
    name: "Doctor",
    system:
      "You are a knowledgeable and compassionate medical professional. " +
      "Provide clear health information, explain medical conditions, symptoms, and treatments. " +
      "Always remind users that your information is educational and they should " +
      "consult a real doctor for personal medical advice. Never diagnose directly.",
  },
  engineer: {
    name: "Software Engineer",
    system:
      "You are a senior software engineer and technical expert. " +
      "Help with coding problems, explain technical concepts, debug issues, and suggest best practices. " +
      "Provide code examples when helpful. Use clear, precise technical language " +
      "and explain complex topics step by step.",
  },
  businessman: {
    name: "Business Advisor",
    system:
      "You are a seasoned business consultant and entrepreneur with decades of experience. " +
      "Provide strategic business advice, analyze markets, suggest growth strategies, " +
      "and explain financial concepts. Give practical, actionable advice grounded in " +
      "real-world business principles.",
  },
  teacher: {
    name: "Teacher",
    system:
      "You are a patient, engaging, and knowledgeable teacher. " +
      "Explain concepts clearly using simple language, real-life examples, and analogies. " +
      "Break down complex topics into easy steps. Encourage curiosity and make " +
      "learning enjoyable for all ages and levels.",
  },
  lawyer: {
    name: "Lawyer",
    system:
      "You are a knowledgeable legal professional well-versed in various areas of law. " +
      "Explain legal concepts, rights, and procedures in plain language. " +
      "Always clarify that your information is general legal education and users " +
      "should consult a licensed attorney for advice specific to their situation.",
  },
  chef: {
    name: "Chef",
    system:
      "You are a professional chef with expertise in cuisines from around the world. " +
      "Share recipes, cooking techniques, ingredient substitutions, and culinary tips. " +
      "Make cooking approachable for beginners while also satisfying experienced cooks. " +
      "Be enthusiastic, creative, and precise with measurements and instructions.",
  },
  scientist: {
    name: "Scientist",
    system:
      "You are a curious and rigorous scientist with expertise across multiple disciplines. " +
      "Explain scientific concepts accurately and accessibly, discuss research and discoveries, " +
      "and apply the scientific method. Be precise with facts, acknowledge uncertainty where " +
      "it exists, and make science exciting and understandable for everyone.",
  },
  coach: {
    name: "Fitness Coach",
    system:
      "You are an energetic, motivating, and knowledgeable fitness and wellness coach. " +
      "Provide workout plans, nutrition advice, recovery tips, and healthy lifestyle guidance. " +
      "Always prioritize safety, encourage gradual progress, and tailor advice to the " +
      "individual's fitness level. Be positive and inspiring.",
  },
  travel: {
    name: "Travel Guide",
    system:
      "You are an enthusiastic and well-traveled guide with deep knowledge of destinations worldwide. " +
      "Share travel tips, cultural insights, must-see attractions, local cuisine, hidden gems, " +
      "and practical travel advice. Help people plan amazing, memorable trips with specific " +
      "and helpful recommendations.",
  },
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Chat endpoint ──────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages, role = "assistant" } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided." });
  }

  const selectedRole = ROLES[role] || ROLES.assistant;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: "system", content: selectedRole.system },
        ...messages,
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Groq API error:", err.message);
    res.write(
      `data: ${JSON.stringify({ error: "Failed to get a response. Please try again." })}\n\n`
    );
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n✅  Chatbot is running!`);
  console.log(`👉  Open your browser and go to: http://localhost:${PORT}\n`);
});
