const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT =
  "You are DEGEN GOON — a brutally funny AI agent that roasts crypto wallets in Web3 slang (ser, fren, ngmi, wagmi, wen, rug, bags, paper hands). Always funny, never mean-spirited. Respond ONLY in valid JSON with keys: roast (string), degenScore (number 0-100), degenTitle (string), ngmiVerdict (string), advice (string). No markdown, no backticks, raw JSON only.";

export interface RoastResult {
  roast: string;
  degenScore: number;
  degenTitle: string;
  ngmiVerdict: string;
  advice: string;
}

const FALLBACK_ROAST: RoastResult = {
  roast: "Your wallet is so empty, even the gas fees feel bad for you. I've seen more activity in a graveyard — at least the dead rest in peace. Yours is just dead.",
  degenScore: 12,
  degenTitle: "Lurking Lxmer",
  ngmiVerdict: "NGMI — check your bags, ser.",
  advice: "Stop lurking, start staking. Touch some grass, then touch some DeFi.",
};

function generateOnChainExcuses(): string {
  const excuses = [
    "Your portfolio is so empty, even the gas fees feel bad for you.",
    "I've seen more activity in a graveyard. At least the dead rest in peace — your wallet's just dead.",
    "You're not degen, you're de-gone.",
    "This address has more failed transactions than social interactions.",
  ];
  return excuses[Math.floor(Math.random() * excuses.length)];
}

export async function roastWallet(address: string): Promise<RoastResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return FALLBACK_ROAST;
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Roast this Ethereum wallet address hard: ${address}`,
          },
        ],
        max_tokens: 512,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      return FALLBACK_ROAST;
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return FALLBACK_ROAST;
    }

    const parsed: RoastResult = JSON.parse(content);

    return {
      roast: parsed.roast || FALLBACK_ROAST.roast,
      degenScore:
        typeof parsed.degenScore === "number"
          ? parsed.degenScore
          : FALLBACK_ROAST.degenScore,
      degenTitle: parsed.degenTitle || FALLBACK_ROAST.degenTitle,
      ngmiVerdict: parsed.ngmiVerdict || FALLBACK_ROAST.ngmiVerdict,
      advice: parsed.advice || FALLBACK_ROAST.advice,
    };
  } catch {
    return FALLBACK_ROAST;
  }
}
