const { GoogleGenerativeAI } = require("@google/generative-ai");
const { HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const readline = require("readline");
require("dotenv").config();

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to get input from the console
const getInput = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (input) => {
      resolve(input);
    });
  });
};

const getChat = async () => {
  const generationConfig = {
    stopSequences: ["red"],
    maxOutputTokens: 500,
    temperature: 1,
    topP: 0.1,
    topK: 16,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings,
    generationConfig,
  });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hello, can you talk to me?" }],
      },
    ],
  });
  return chat;
};

async function run(chat, prompt) {
  try {
    const result = await chat.sendMessageStream(prompt);
    let text = "";
    console.log();
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      for (const letter of chunkText) {
        await sleep(10);
        text += letter;
        process.stdout.write(letter);
      }
    }
    console.log();
  } catch (err) {
    console.error(err);
  }
}

let continueChat = true;
const goChat = async () => {
  const chat = await getChat();
  while (continueChat) {
    let userMessage = await getInput("You: ");
    if (userMessage === "exit") {
      continueChat = false;
      rl.close();
      break;
    }
    prompt = userMessage;
    await run(chat, prompt);
  }
};

goChat();
