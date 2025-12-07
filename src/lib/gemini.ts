import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface BookData {
  title: string;
  authors: string[];
  isbn?: string;
  year?: string;
  publisher?: string;
  description?: string;
  cover_url?: string;
  genres?: string[];
  pages?: number;
  language?: string;
}

export async function fetchBookDataWithGemini(query: string): Promise<BookData | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Find comprehensive book information for: "${query}"
    
    Return ONLY a valid JSON object with the following structure:
    {
      "title": "Book Title",
      "authors": ["Author 1", "Author 2"],
      "isbn": "ISBN if available",
      "year": "Publication year",
      "publisher": "Publisher name",
      "description": "Brief book description",
      "cover_url": "Direct URL to book cover image",
      "genres": ["Genre 1", "Genre 2"],
      "pages": number of pages,
      "language": "Language"
    }
    
    If any field is not available, use null. For authors, always return an array even if there's only one author.
    For cover_url, try to find a high-quality cover image URL.
    Be accurate and only return information you're confident about.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response:', text);
      return null;
    }

    const bookData = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the data
    return {
      title: bookData.title || '',
      authors: Array.isArray(bookData.authors) ? bookData.authors : [bookData.authors || 'Unknown Author'],
      isbn: bookData.isbn || null,
      year: bookData.year || null,
      publisher: bookData.publisher || null,
      description: bookData.description || null,
      cover_url: bookData.cover_url || null,
      genres: Array.isArray(bookData.genres) ? bookData.genres : [],
      pages: bookData.pages || null,
      language: bookData.language || null,
    };
  } catch (error) {
    console.error('Error fetching book data with Gemini:', error);
    return null;
  }
}

export async function analyzeBookCoverWithGemini(imageBase64: string): Promise<BookData | null> {
  try {
    console.log('🔍 Starting Gemini book cover analysis...');
    
    // Check if API key is available
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.error('❌ Gemini API key not found. Please add VITE_GEMINI_API_KEY to your environment variables.');
      throw new Error('Gemini API key not configured');
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze this book cover image and search for comprehensive book information online.
    
    First, identify from the cover:
    - Book title
    - Author(s) name(s)
    - Publisher (if visible)
    - Any publication year or copyright information
    
    Then, search online for this book to find complete information including:
    - Exact publication year
    - ISBN (if available)
    - Publisher details
    - Book description/summary
    - Genre/category
    - Number of pages
    - Language
    
    Return ONLY a valid JSON object with the following structure:
    {
      "title": "Exact Book Title",
      "authors": ["Author 1", "Author 2"],
      "isbn": "ISBN if found",
      "year": "Publication year",
      "publisher": "Publisher name",
      "description": "Book description/summary",
      "cover_url": "URL to book cover image if found",
      "genres": ["Genre 1", "Genre 2"],
      "pages": number of pages,
      "language": "Language"
    }
    
    IMPORTANT: 
    - Search online for accurate, up-to-date information
    - Use reliable sources like Goodreads, Amazon, publisher websites, etc.
    - If you find multiple editions, use the most recent or most popular one
    - For the year, use the first publication year, not reprint years
    - Be as accurate as possible with all information
    
    If any field cannot be found, use null. For authors, always return an array even if there's only one author.
    `;

    console.log('📤 Sending image to Gemini API for online search...');
    console.log('📏 Image size:', Math.round(imageBase64.length / 1024), 'KB');
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      }
    ]);
    
    console.log('📥 Received response from Gemini API...');
    const response = await result.response;
    const text = response.text();
    
    console.log('📄 Raw response length:', text.length, 'characters');
    console.log('📄 Raw response preview:', text.substring(0, 200) + '...');
    
    console.log('🔍 Extracting JSON from response...');
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in Gemini response. Full response:', text);
      throw new Error('Invalid response format from Gemini API');
    }

    console.log('📋 Parsing book data...');
    const bookData = JSON.parse(jsonMatch[0]);
    
    console.log('✅ Book data extracted from online search:', bookData);
    
    // Validate and clean the data
    const cleanedData = {
      title: bookData.title || '',
      authors: Array.isArray(bookData.authors) ? bookData.authors : [bookData.authors || 'Unknown Author'],
      isbn: bookData.isbn || null,
      year: bookData.year || null,
      publisher: bookData.publisher || null,
      description: bookData.description || null,
      cover_url: bookData.cover_url || null,
      genres: Array.isArray(bookData.genres) ? bookData.genres : [],
      pages: bookData.pages || null,
      language: bookData.language || null,
    };
    
    console.log('🎉 Gemini online search completed successfully!');
    return cleanedData;
  } catch (error: any) {
    console.error('❌ Error searching book with Gemini:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Provide more specific error information
    if (error.message?.includes('API key')) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    } else if (error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please check your API usage limits.');
    } else if (error.message?.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
    }
  }
}

export async function searchBooksWithGemini(query: string): Promise<BookData[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Search for books matching: "${query}"
    
    Return ONLY a valid JSON array with up to 5 books, each with this structure:
    [
      {
        "title": "Book Title",
        "authors": ["Author 1", "Author 2"],
        "isbn": "ISBN if available",
        "year": "Publication year",
        "publisher": "Publisher name",
        "description": "Brief book description",
        "cover_url": "Direct URL to book cover image",
        "genres": ["Genre 1", "Genre 2"],
        "pages": number of pages,
        "language": "Language"
      }
    ]
    
    If any field is not available, use null. For authors, always return an array even if there's only one author.
    For cover_url, try to find a high-quality cover image URL.
    Be accurate and only return information you're confident about.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in Gemini response:', text);
      return [];
    }

    const booksData = JSON.parse(jsonMatch[0]);
    
    // Validate and clean each book's data
    return booksData.map((book: any) => ({
      title: book.title || '',
      authors: Array.isArray(book.authors) ? book.authors : [book.authors || 'Unknown Author'],
      isbn: book.isbn || null,
      year: book.year || null,
      publisher: book.publisher || null,
      description: book.description || null,
      cover_url: book.cover_url || null,
      genres: Array.isArray(book.genres) ? book.genres : [],
      pages: book.pages || null,
      language: book.language || null,
    }));
  } catch (error) {
    console.error('Error searching books with Gemini:', error);
    return [];
  }
} 