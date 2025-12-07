import { getBooksCollection, serializeBook } from "./_lib/mongo";

export const config = {
  runtime: "nodejs18.x",
};

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });

export default async function handler(req: Request): Promise<Response> {
  const collection = await getBooksCollection();

  if (req.method === "GET") {
    // Sort by date_recorded (descending), then created_at (descending)
    const docs = await collection.find().sort({ date_recorded: -1, created_at: -1 }).toArray();
    return jsonResponse({ books: docs.map(serializeBook) });
  }

  if (req.method === "POST") {
    const payload = await req.json().catch(() => null);

    if (!payload) {
      return jsonResponse({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const title = (payload.title ?? "").trim();
    const authors = (payload.authors ?? "").trim();
    const isbn = (payload.isbn ?? "").trim();

    if (!title || !authors) {
      return jsonResponse({ message: "Title and authors are required" }, { status: 400 });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const insertDoc = {
      title,
      author: authors,
      isbn: isbn || null,
      cover_url: payload.cover_url || null,
      year: payload.year || "0000",
      publisher: payload.publisher || null,
      genre: payload.genre || null,
      description: payload.description || null,
      date_recorded: today,
      created_at: new Date().toISOString(),
    };

    const insertResult = await collection.insertOne(insertDoc);
    const saved = await collection.findOne({ _id: insertResult.insertedId });

    if (!saved) {
      return jsonResponse({ message: "Book insertion failed" }, { status: 500 });
    }

    return jsonResponse({ book: serializeBook(saved) }, { status: 201 });
  }

  return jsonResponse({ message: "Method Not Allowed" }, { status: 405 });
}

