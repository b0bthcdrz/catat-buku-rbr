import { MongoClient, Collection, Document, WithId } from "mongodb";

const dbName = process.env.MONGODB_DB_NAME ?? "book_snap_shelf";

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalWithMongo = globalThis as GlobalWithMongo;

function createClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  const client = new MongoClient(uri);
  return client.connect();
}

const clientPromise = globalWithMongo._mongoClientPromise ?? createClientPromise();

if (!globalWithMongo._mongoClientPromise) {
  globalWithMongo._mongoClientPromise = clientPromise;
}

export type BookDocument = {
  user_id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  year: string | null;
  publisher: string | null;
  genre: string | null;
  description: string | null;
  created_at: string;
};

export async function getBooksCollection(): Promise<Collection<BookDocument>> {
  const client = await clientPromise;
  return client.db(dbName).collection<BookDocument>("books");
}

export function serializeBook(doc: WithId<BookDocument>) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    author: doc.author,
    isbn: doc.isbn,
    cover_url: doc.cover_url,
    year: doc.year,
    publisher: doc.publisher,
    genre: doc.genre,
    description: doc.description,
    created_at: doc.created_at,
  };
}

