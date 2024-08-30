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
    maxOutputTokens: 700,
    temperature: 1.2,
    topP: 0.4,
    topK: 25,
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
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
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
        parts: [
          {
            text: "Hi, Can you design an interestring story and ask the player to make decisions? Tell the player the number for each decision and after they make the choice, push the story forward and give them more choices.",
          },
          {
            text: "Do not make the story a POV story, make it a story where the player is making decisions like a game. E.g. make the player a commander of an army or a space ship captain. Be creative and wild with the story.",
          },

          {
            text: "Try to push the story forward with each choice the player makes. Design the choices big, don't make them boring. Please start by telling the player the setting of the story. Remember don't make your reply too long.",
          },
        ],
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

// Try to summarize the story now as It will be saved in the database for the player to continue from where they left off.
