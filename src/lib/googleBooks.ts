const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

export type GoogleBooksResult = {
  title?: string;
  authors?: string[];
  publisher?: string;
  description?: string;
  year?: string;
  genre?: string;
  coverUrl?: string;
};

function normalizeYear(publishedDate?: string | null): string {
  if (!publishedDate) return "";
  const match = publishedDate.match(/\d{4}/);
  return match ? match[0] : "";
}

export async function fetchBookByIsbn(isbn: string): Promise<GoogleBooksResult | null> {
  const url = new URL(GOOGLE_BOOKS_ENDPOINT);
  url.searchParams.set("q", `isbn:${isbn}`);
  url.searchParams.set("maxResults", "1");

  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Google Books lookup failed");
  }

  const payload = await response.json();

  if (!payload.items || payload.items.length === 0) {
    return null;
  }

  const volume = payload.items[0]?.volumeInfo ?? {};
  const identifiers: Array<{ type?: string; identifier?: string }> = volume.industryIdentifiers ?? [];
  const cover =
    volume.imageLinks?.thumbnail ||
    volume.imageLinks?.smallThumbnail ||
    volume.imageLinks?.extraLarge ||
    volume.imageLinks?.large ||
    volume.imageLinks?.medium;

  return {
    title: volume.title ?? "",
    authors: volume.authors ?? [],
    publisher: volume.publisher ?? "",
    description: volume.description ?? "",
    year: normalizeYear(volume.publishedDate),
    genre: volume.categories?.[0] ?? "",
    coverUrl: cover ? cover.replace("http://", "https://") : "",
  };
}



