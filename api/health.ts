import { getBooksCollection } from "./_lib/mongo";

export const config = {
  runtime: "nodejs",
};

const GOOGLE_SAMPLE_ISBN = "9780143127741";

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });

export default async function handler(): Promise<Response> {
  const googleBooksApiKey = process.env.VITE_GOOGLE_BOOKS_API_KEY;
  const results = {
    mongodb: false,
    googleBooks: false,
  };

  // MongoDB connectivity check
  try {
    const collection = await getBooksCollection();
    await collection.estimatedDocumentCount(); // lightweight call
    results.mongodb = true;
  } catch (e) {
    results.mongodb = false;
  }

  // Google Books connectivity check (uses provided key if present)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", `isbn:${GOOGLE_SAMPLE_ISBN}`);
    url.searchParams.set("maxResults", "1");
    if (googleBooksApiKey) {
      url.searchParams.set("key", googleBooksApiKey);
    }
    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    results.googleBooks = response.ok;
  } catch (e) {
    results.googleBooks = false;
  }

  return jsonResponse(results);
}
