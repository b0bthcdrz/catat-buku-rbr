import { getBooksCollection, serializeBook } from "./_lib/mongo";

export const config = {
  runtime: "nodejs18.x",
};

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

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
    const docs = await collection.find().sort({ created_at: -1 }).toArray();
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

    if (isbn) {
      const existing = await collection.findOne({ isbn });
      if (existing) {
        return jsonResponse({ message: "A book with this ISBN already exists." }, { status: 409 });
      }
    }

    const insertDoc = {
      user_id: DEMO_USER_ID,
      title,
      author: authors,
      isbn: isbn || null,
      cover_url: payload.cover_url || null,
      year: payload.year || "0000",
      publisher: payload.publisher || null,
      genre: payload.genre || null,
      description: payload.description || null,
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

