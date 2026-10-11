export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  number: number;
  verses: Verse[];
}

export interface Book {
  name: string;
  number: number;
  chapters: Chapter[];
}

export interface BibleVersion {
  id: string; // e.g., 'KJV'
  name: string;
  books: Book[];
}

// Simple IndexedDB Wrapper
const DB_NAME = 'WebProjectorDB';
const DB_VERSION = 3;
const STORE_NAME = 'bibles';
const SONG_STORE = 'songs';
const MEDIA_STORE = 'media';

export function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SONG_STORE)) {
        db.createObjectStore(SONG_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      }
    };
  });
}

export const bibleService = {
  async saveBible(bible: BibleVersion): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(bible);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAllBibles(): Promise<BibleVersion[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteBible(id: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Standard 66 Bible books with common aliases and OSIS codes
  STANDARD_BOOKS: [
    { number: 1, name: "Genesis", aliases: ["genesis", "gen", "ge", "gn"] },
    { number: 2, name: "Exodus", aliases: ["exodus", "exo", "ex", "exod"] },
    { number: 3, name: "Leviticus", aliases: ["leviticus", "lev", "le", "lv"] },
    { number: 4, name: "Numbers", aliases: ["numbers", "num", "nu", "nm", "nb"] },
    { number: 5, name: "Deuteronomy", aliases: ["deuteronomy", "deut", "deu", "dt"] },
    { number: 6, name: "Joshua", aliases: ["joshua", "josh", "jos", "jsh"] },
    { number: 7, name: "Judges", aliases: ["judges", "judg", "jdg", "jg", "jdgs"] },
    { number: 8, name: "Ruth", aliases: ["ruth", "rut", "ru"] },
    { number: 9, name: "1 Samuel", aliases: ["1 samuel", "1 sam", "1sa", "1s", "i samuel", "i sam", "1samuel", "1sam"] },
    { number: 10, name: "2 Samuel", aliases: ["2 samuel", "2 sam", "2sa", "2s", "ii samuel", "ii sam", "2samuel", "2sam"] },
    { number: 11, name: "1 Kings", aliases: ["1 kings", "1 kgs", "1ki", "1k", "i kings", "i kgs", "1kings", "1kg"] },
    { number: 12, name: "2 Kings", aliases: ["2 kings", "2 kgs", "2ki", "2k", "ii kings", "ii kgs", "2kings", "2kg"] },
    { number: 13, name: "1 Chronicles", aliases: ["1 chronicles", "1 chron", "1ch", "i chronicles", "1chr", "1chronicles", "1chron"] },
    { number: 14, name: "2 Chronicles", aliases: ["2 chronicles", "2 chron", "2ch", "ii chronicles", "2chr", "2chronicles", "2chron"] },
    { number: 15, name: "Ezra", aliases: ["ezra", "ezr", "ez"] },
    { number: 16, name: "Nehemiah", aliases: ["nehemiah", "neh", "ne"] },
    { number: 17, name: "Esther", aliases: ["esther", "est", "es"] },
    { number: 18, name: "Job", aliases: ["job", "jb"] },
    { number: 19, name: "Psalms", aliases: ["psalms", "psalm", "psa", "ps", "pss"] },
    { number: 20, name: "Proverbs", aliases: ["proverbs", "prov", "pro", "pr", "prv"] },
    { number: 21, name: "Ecclesiastes", aliases: ["ecclesiastes", "eccles", "ecc", "ec", "qoh"] },
    { number: 22, name: "Song of Solomon", aliases: ["song of solomon", "song of songs", "song", "sos", "canticles", "canticle"] },
    { number: 23, name: "Isaiah", aliases: ["isaiah", "isa", "is"] },
    { number: 24, name: "Jeremiah", aliases: ["jeremiah", "jer", "je", "jr"] },
    { number: 25, name: "Lamentations", aliases: ["lamentations", "lam", "la"] },
    { number: 26, name: "Ezekiel", aliases: ["ezekiel", "ezek", "eze", "ezk"] },
    { number: 27, name: "Daniel", aliases: ["daniel", "dan", "da", "dn"] },
    { number: 28, name: "Hosea", aliases: ["hosea", "hos", "ho"] },
    { number: 29, name: "Joel", aliases: ["joel", "joe", "jl"] },
    { number: 30, name: "Amos", aliases: ["amos", "amo", "am"] },
    { number: 31, name: "Obadiah", aliases: ["obadiah", "oba", "ob"] },
    { number: 32, name: "Jonah", aliases: ["jonah", "jon", "jnh"] },
    { number: 33, name: "Micah", aliases: ["micah", "mic", "mc"] },
    { number: 34, name: "Nahum", aliases: ["nahum", "nah", "na"] },
    { number: 35, name: "Habakkuk", aliases: ["habakkuk", "hab", "hb"] },
    { number: 36, name: "Zephaniah", aliases: ["zephaniah", "zeph", "zep", "zp"] },
    { number: 37, name: "Haggai", aliases: ["haggai", "hag", "hg"] },
    { number: 38, name: "Zechariah", aliases: ["zechariah", "zech", "zec", "zc"] },
    { number: 39, name: "Malachi", aliases: ["malachi", "mal", "ml"] },
    { number: 40, name: "Matthew", aliases: ["matthew", "matt", "mat", "mt"] },
    { number: 41, name: "Mark", aliases: ["mark", "mrk", "mar", "mk"] },
    { number: 42, name: "Luke", aliases: ["luke", "luk", "lk"] },
    { number: 43, name: "John", aliases: ["john", "jhn", "joh", "jn"] },
    { number: 44, name: "Acts", aliases: ["acts", "act", "ac"] },
    { number: 45, name: "Romans", aliases: ["romans", "rom", "ro", "rm"] },
    { number: 46, name: "1 Corinthians", aliases: ["1 corinthians", "1 cor", "1co", "1c", "i corinthians", "i cor", "1corinthians", "1cor"] },
    { number: 47, name: "2 Corinthians", aliases: ["2 corinthians", "2 cor", "2co", "2c", "ii corinthians", "ii cor", "2corinthians", "2cor"] },
    { number: 48, name: "Galatians", aliases: ["galatians", "gal", "ga"] },
    { number: 49, name: "Ephesians", aliases: ["ephesians", "eph", "ep"] },
    { number: 50, name: "Philippians", aliases: ["philippians", "phil", "php", "pp"] },
    { number: 51, name: "Colossians", aliases: ["colossians", "col", "co"] },
    { number: 52, name: "1 Thessalonians", aliases: ["1 thessalonians", "1 thess", "1th", "i thessalonians", "1thessalonians", "1thess"] },
    { number: 53, name: "2 Thessalonians", aliases: ["2 thessalonians", "2 thess", "2th", "ii thessalonians", "2thessalonians", "2thess"] },
    { number: 54, name: "1 Timothy", aliases: ["1 timothy", "1 tim", "1ti", "1t", "i timothy", "1timothy", "1tim"] },
    { number: 55, name: "2 Timothy", aliases: ["2 timothy", "2 tim", "2ti", "2t", "ii timothy", "2timothy", "2tim"] },
    { number: 56, name: "Titus", aliases: ["titus", "tit", "ti"] },
    { number: 57, name: "Philemon", aliases: ["philemon", "philem", "phm", "pm"] },
    { number: 58, name: "Hebrews", aliases: ["hebrews", "heb", "he"] },
    { number: 59, name: "James", aliases: ["james", "jas", "jm"] },
    { number: 60, name: "1 Peter", aliases: ["1 peter", "1 pet", "1pe", "1p", "i peter", "1peter", "1pet"] },
    { number: 61, name: "2 Peter", aliases: ["2 peter", "2 pet", "2pe", "2p", "ii peter", "2peter", "2pet"] },
    { number: 62, name: "1 John", aliases: ["1 john", "1 jhn", "1jn", "1j", "i john", "1john"] },
    { number: 63, name: "2 John", aliases: ["2 john", "2 jhn", "2jn", "2j", "ii john", "2john"] },
    { number: 64, name: "3 John", aliases: ["3 john", "3 jhn", "3jn", "3j", "iii john", "3john"] },
    { number: 65, name: "Jude", aliases: ["jude", "jud", "jd"] },
    { number: 66, name: "Revelation", aliases: ["revelation", "rev", "re", "apocalypse"] }
  ],

  resolveBookInfo(rawName: string | null | undefined, rawNumber: string | null | undefined, index: number): { name: string; number: number } {
    if (rawName) {
      const clean = rawName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const b of this.STANDARD_BOOKS) {
        if (b.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean) {
          return { name: b.name, number: b.number };
        }
        if (b.aliases.some(a => a.replace(/[^a-z0-9]/g, '') === clean)) {
          return { name: b.name, number: b.number };
        }
      }
    }
    const num = parseInt(rawNumber || '', 10);
    if (!isNaN(num) && num >= 1 && num <= this.STANDARD_BOOKS.length) {
      return { name: this.STANDARD_BOOKS[num - 1].name, number: num };
    }
    if (index >= 0 && index < this.STANDARD_BOOKS.length) {
      return { name: this.STANDARD_BOOKS[index].name, number: index + 1 };
    }
    return { name: rawName?.trim() || `Book ${index + 1}`, number: index + 1 };
  },

  cleanVerseText(rawText: string): string {
    if (!rawText) return '';
    // Strip XML/HTML tags (like <NOTE>, <i>, <font>, etc.) while keeping the text content
    let text = rawText.replace(/<[^>]*>/g, '');
    // Decode common and numeric entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    return text.replace(/\s+/g, ' ').trim();
  },

  sanitizeXmlString(xmlString: string): string {
    let xml = xmlString.trim().replace(/^\uFEFF/, '');
    // Replace undeclared HTML entities that crash XML parsers
    xml = xml
      .replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '…')
      .replace(/&rsquo;/g, '’')
      .replace(/&lsquo;/g, '‘')
      .replace(/&rdquo;/g, '”')
      .replace(/&ldquo;/g, '“')
      .replace(/&copy;/g, '©')
      .replace(/&trade;/g, '™')
      .replace(/&bull;/g, '•');
    // Escape unescaped ampersands that are not valid XML entities
    xml = xml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
    // Remove stray closing tags that appear before the first opening book tag
    xml = xml.replace(/^(?:[\s\S]*?<XMLBIBLE[^>]*>)?(\s*<\/(?:CHAPTER|BIBLEBOOK|book|chapter)>)+/i, (match, stray) => {
      return match.replace(stray, '');
    });
    // Remove duplicate trailing </CHAPTER> tags before </BIBLEBOOK>
    xml = xml.replace(/(<\/(?:CHAPTER|chapter)>\s*)+<\/(?:CHAPTER|chapter)>\s*<\/(?:BIBLEBOOK|book)>/gi, '</CHAPTER>\n</BIBLEBOOK>');
    return xml;
  },

  // Converts any parsed Bible to clean, standard, canonical Zefania XML format
  convertToStandardZefaniaXML(bible: BibleVersion): string {
    const escapeXml = (unsafe: string): string => {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(`<XMLBIBLE biblename="${escapeXml(bible.name)}">`);
    for (const book of bible.books) {
      lines.push(`  <BIBLEBOOK bnumber="${book.number}" bname="${escapeXml(book.name)}">`);
      for (const chapter of book.chapters) {
        lines.push(`    <CHAPTER cnumber="${chapter.number}">`);
        for (const verse of chapter.verses) {
          lines.push(`      <VERS vnumber="${verse.number}">${escapeXml(verse.text)}</VERS>`);
        }
        lines.push('    </CHAPTER>');
      }
      lines.push('  </BIBLEBOOK>');
    }
    lines.push('</XMLBIBLE>');
    return lines.join('\n');
  },

  // Tolerant regex fallback parser: recovers ALL books, chapters, and verses even from heavily malformed or non-standard XML
  parseTolerantBible(xmlText: string, id: string, name: string): BibleVersion {
    const extractAttr = (str: string, attrName: string): string | null => {
      if (!str) return null;
      const m = str.match(new RegExp('(?:\\b' + attrName + ')\\s*=\\s*["\']([^"\']*)["\']', 'i'))
             || str.match(new RegExp('(?:\\b' + attrName + ')\\s*=\\s*([0-9a-zA-Z_-]+)', 'i'));
      return m ? m[1].trim() : null;
    };

    const bookRegex = /<(?:BIBLEBOOK|book|b)\b([^>]*)>([\s\S]*?)(?=<(?:BIBLEBOOK|book|b)\b|<\/(?:XMLBIBLE|bible)>|$)/gi;
    const chapterRegex = /<(?:CHAPTER|chapter|c|ch)\b([^>]*)>([\s\S]*?)(?=<(?:CHAPTER|chapter|c|ch)\b|<\/(?:BIBLEBOOK|book|b)>|$)/gi;
    const verseRegex = /<(?:VERS|verse|v)\b([^>]*)>([\s\S]*?)(?:<\/(?:VERS|verse|v)>|(?=<(?:VERS|verse|v)\b)|$)/gi;
    
    const parsedBooks: Book[] = [];
    let bMatch: RegExpExecArray | null;
    let bookIndex = 0;

    while ((bMatch = bookRegex.exec(xmlText)) !== null) {
      const bookAttrs = bMatch[1];
      const bookContent = bMatch[2];

      const rawNum = extractAttr(bookAttrs, 'bnumber') || extractAttr(bookAttrs, 'number') || extractAttr(bookAttrs, 'n');
      const rawName = extractAttr(bookAttrs, 'bname') || extractAttr(bookAttrs, 'name') || extractAttr(bookAttrs, 'title');
      const resolved = this.resolveBookInfo(rawName, rawNum, bookIndex);
      bookIndex++;

      const parsedChapters: Chapter[] = [];
      chapterRegex.lastIndex = 0;
      let cMatch: RegExpExecArray | null;
      let chapIndex = 0;

      while ((cMatch = chapterRegex.exec(bookContent)) !== null) {
        chapIndex++;
        const chapAttrs = cMatch[1];
        const chapContent = cMatch[2];
        const rawCNum = extractAttr(chapAttrs, 'cnumber') || extractAttr(chapAttrs, 'number') || extractAttr(chapAttrs, 'cno') || extractAttr(chapAttrs, 'n');
        const cNumber = parseInt(rawCNum || `${chapIndex}`, 10) || chapIndex;

        const parsedVerses: Verse[] = [];
        verseRegex.lastIndex = 0;
        let vMatch: RegExpExecArray | null;
        let verseIndex = 0;

        while ((vMatch = verseRegex.exec(chapContent)) !== null) {
          verseIndex++;
          const verseAttrs = vMatch[1];
          let rawVerseText = vMatch[2];
          if (!rawVerseText || rawVerseText.trim() === '') {
            rawVerseText = extractAttr(verseAttrs, 'text') || '';
          }
          const rawVNum = extractAttr(verseAttrs, 'vnumber') || extractAttr(verseAttrs, 'number') || extractAttr(verseAttrs, 'vno') || extractAttr(verseAttrs, 'n');
          const vNumber = parseInt(rawVNum || `${verseIndex}`, 10) || verseIndex;
          const text = this.cleanVerseText(rawVerseText);

          parsedVerses.push({
            number: vNumber,
            text
          });
        }

        if (parsedVerses.length > 0) {
          parsedChapters.push({
            number: cNumber,
            verses: parsedVerses
          });
        }
      }

      if (parsedChapters.length > 0) {
        parsedBooks.push({
          name: resolved.name,
          number: resolved.number,
          chapters: parsedChapters
        });
      }
    }

    return { id, name, books: parsedBooks };
  },

  // Parses Zefania XML format and all common variants (OpenLP, AMPC, BSB, etc.) with automatic error recovery and normalization
  async parseZefaniaXML(xmlString: string, id: string, name: string): Promise<BibleVersion> {
    const cleanXml = this.sanitizeXmlString(xmlString);
    let parsedBooks: Book[] = [];
    let needsNormalization = false;

    // 1. Try standard DOMParser first
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(cleanXml, "text/xml");
      const hasError = xmlDoc.getElementsByTagName('parsererror').length > 0;

      if (!hasError) {
        let booksElement = xmlDoc.getElementsByTagName('BIBLEBOOK');
        if (booksElement.length === 0) {
          booksElement = xmlDoc.getElementsByTagName('book');
        }
        if (booksElement.length === 0) {
          booksElement = xmlDoc.getElementsByTagName('b');
        }

        for (let i = 0; i < booksElement.length; i++) {
          const bookNode = booksElement[i];
          const bNumberStr = bookNode.getAttribute('bnumber') || bookNode.getAttribute('number') || bookNode.getAttribute('n');
          const rawBName = bookNode.getAttribute('bname') || bookNode.getAttribute('name') || bookNode.getAttribute('title');
          const resolvedBook = this.resolveBookInfo(rawBName, bNumberStr, i);

          let chaptersElement = bookNode.getElementsByTagName('CHAPTER');
          if (chaptersElement.length === 0) {
            chaptersElement = bookNode.getElementsByTagName('chapter');
          }
          if (chaptersElement.length === 0) {
            chaptersElement = bookNode.getElementsByTagName('c');
          }
          const parsedChapters: Chapter[] = [];

          for (let j = 0; j < chaptersElement.length; j++) {
            const chapterNode = chaptersElement[j];
            const cNumberStr = chapterNode.getAttribute('cnumber') || chapterNode.getAttribute('number') || chapterNode.getAttribute('n');
            const cNumber = parseInt(cNumberStr || `${j + 1}`, 10) || (j + 1);

            let versesElement = chapterNode.getElementsByTagName('VERS');
            if (versesElement.length === 0) {
              versesElement = chapterNode.getElementsByTagName('verse');
            }
            if (versesElement.length === 0) {
              versesElement = chapterNode.getElementsByTagName('v');
            }
            const parsedVerses: Verse[] = [];

            for (let k = 0; k < versesElement.length; k++) {
              const verseNode = versesElement[k];
              const vNumberStr = verseNode.getAttribute('vnumber') || verseNode.getAttribute('number') || verseNode.getAttribute('n');
              const vNumber = parseInt(vNumberStr || `${k + 1}`, 10) || (k + 1);
              const rawVText = verseNode.textContent || verseNode.getAttribute('text') || '';
              const vText = this.cleanVerseText(rawVText);

              parsedVerses.push({
                number: vNumber,
                text: vText
              });
            }

            if (parsedVerses.length > 0) {
              parsedChapters.push({
                number: cNumber,
                verses: parsedVerses
              });
            }
          }

          if (parsedChapters.length > 0) {
            parsedBooks.push({
              name: resolvedBook.name,
              number: resolvedBook.number,
              chapters: parsedChapters
            });
          }
        }
      } else {
        needsNormalization = true;
      }
    } catch (e) {
      needsNormalization = true;
      console.warn("Standard DOMParser failed, engaging tolerant Bible parser...", e);
    }

    // 2. If DOMParser produced no books or failed, smoothly fallback to tolerant regex parser
    if (parsedBooks.length === 0) {
      needsNormalization = true;
      const fallbackResult = this.parseTolerantBible(cleanXml, id, name);
      parsedBooks = fallbackResult.books;
    }

    if (parsedBooks.length === 0) {
      throw new Error(`Unable to extract Bible books or verses from ${name}. Please check file content.`);
    }

    const bibleVersion: BibleVersion = {
      id,
      name,
      books: parsedBooks
    };

    // Save into IndexedDB cache
    await this.saveBible(bibleVersion);

    // If source had syntax errors or non-standard tags, automatically convert to standard Zefania XML in background
    if (needsNormalization) {
      try {
        const standardXml = this.convertToStandardZefaniaXML(bibleVersion);
        const filename = name.toLowerCase().endsWith('.xml') ? name : `${name}.xml`;
        this.saveBibleToServer(filename, standardXml).catch(() => {});
      } catch (err) {
        console.warn("Background Bible conversion skipped:", err);
      }
    }

    return bibleVersion;
  },

  async getAvailableServerBibles(): Promise<string[]> {
    try {
      const res = await fetch('/api/bibles/list');
      if (res.ok) {
        return await res.json();
      }
    } catch(e) {
      console.error("Failed to fetch available bibles", e);
    }
    return [];
  },

  async loadBibleFromServer(filename: string): Promise<BibleVersion | null> {
    try {
      const res = await fetch(`/api/bibles/file?name=${filename}`);
      if (res.ok) {
        const xmlText = await res.text();
        const id = "bible_" + filename.replace('.xml', '');
        const name = filename.replace('.xml', '');
        return await this.parseZefaniaXML(xmlText, id, name);
      }
    } catch(e) {
      console.error("Failed to load bible from server", e);
    }
    return null;
  },

  async saveBibleToServer(filename: string, content: string): Promise<boolean> {
    try {
      const res = await fetch('/api/bibles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content }),
      });
      return res.ok;
    } catch (e) {
      console.error("Failed to save bible to server disk", e);
      return false;
    }
  },

  async deleteBibleFromServer(filename: string): Promise<boolean> {
    try {
      const res = await fetch('/api/bibles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      return res.ok;
    } catch (e) {
      console.error("Failed to delete bible from server disk", e);
      return false;
    }
  }
};

