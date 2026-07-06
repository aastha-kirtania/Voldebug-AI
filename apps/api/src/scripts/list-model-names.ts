import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const modelsResult = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data: any = await modelsResult.json();
    if (data.models) {
      console.log("All model names:");
      for (const m of data.models) {
        console.log(" - ", m.name);
      }
    } else {
      console.log("No models key in response:", data);
    }
  } catch (err: any) {
    console.error("Error occurred:", err);
  }
}

test();
