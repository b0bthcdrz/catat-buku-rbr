import { ObjectId } from "mongodb";
import { getBooksCollection, serializeBook } from "../_lib/mongo";

export const config = {
  runtime: "nodejs",
};

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });

const extractId = (url: string): string | null => {
  const segments = new URL(url).pathname.split("/");
  let id = segments.pop() || "";
  if (!id && segments.length) {
    id = segments.pop() || "";
  }
  return id || null;
};

export default async function handler(req: Request): Promise<Response> {
  const collection = await getBooksCollection();
  const id = extractId(req.url);

  if (!id) {
    return jsonResponse({ message: "Book id is required" }, { status: 400 });
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return jsonResponse({ message: "Invalid book id" }, { status: 400 });
  }

  if (req.method === "GET") {
    const doc = await collection.findOne({ _id: objectId });
    if (!doc) {
      return jsonResponse({ message: "Book not found" }, { status: 404 });
    }
    return jsonResponse({ book: serializeBook(doc) });
  }

  // Edit and delete functionality removed - books are read-only records

  return jsonResponse({ message: "Method Not Allowed" }, { status: 405 });
}

