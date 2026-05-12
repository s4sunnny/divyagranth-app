import {Bookmark, Highlight, Note} from '@/types';
import {ListStorage, localId} from './ListStorage';
import {StorageKeys} from './keys';

// =====================================================================
// Bookmarks
// =====================================================================
const bookmarks = new ListStorage<Bookmark>(StorageKeys.BOOKMARKS);

export const BookmarkStorage = {
  list: () => bookmarks.getAll(),
  forBook: (bookId: string) => bookmarks.filter(b => b.bookId === bookId),

  async create(input: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    const bookmark: Bookmark = {
      ...input,
      id: localId('bm'),
      createdAt: Date.now(),
    };
    await bookmarks.add(bookmark);
    return bookmark;
  },

  remove: (id: string) => bookmarks.remove(id),

  async toggle(input: Omit<Bookmark, 'id' | 'createdAt'>): Promise<boolean> {
    // Returns true if a bookmark now exists, false if removed.
    const existing = (await bookmarks.getAll()).find(
      b =>
        b.bookId === input.bookId &&
        b.chapterId === input.chapterId &&
        b.verseNumber === input.verseNumber,
    );
    if (existing) {
      await bookmarks.remove(existing.id);
      return false;
    }
    await BookmarkStorage.create(input);
    return true;
  },
};

// =====================================================================
// Highlights
// =====================================================================
const highlights = new ListStorage<Highlight>(StorageKeys.HIGHLIGHTS);

export const HighlightStorage = {
  list: () => highlights.getAll(),
  forBook: (bookId: string) => highlights.filter(h => h.bookId === bookId),
  forVerse: (bookId: string, chapterId: string, verseNumber: number) =>
    highlights.filter(
      h =>
        h.bookId === bookId &&
        h.chapterId === chapterId &&
        h.verseNumber === verseNumber,
    ),

  async create(input: Omit<Highlight, 'id' | 'createdAt'>): Promise<Highlight> {
    const h: Highlight = {...input, id: localId('hl'), createdAt: Date.now()};
    await highlights.add(h);
    return h;
  },

  remove: (id: string) => highlights.remove(id),
};

// =====================================================================
// Notes
// =====================================================================
const notes = new ListStorage<Note>(StorageKeys.NOTES);

export const NoteStorage = {
  list: () => notes.getAll(),
  forBook: (bookId: string) => notes.filter(n => n.bookId === bookId),
  forVerse: (bookId: string, chapterId: string, verseNumber: number) =>
    notes.filter(
      n =>
        n.bookId === bookId &&
        n.chapterId === chapterId &&
        n.verseNumber === verseNumber,
    ),

  async create(
    input: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Note> {
    const now = Date.now();
    const n: Note = {...input, id: localId('nt'), createdAt: now, updatedAt: now};
    await notes.add(n);
    return n;
  },

  async edit(id: string, body: string): Promise<void> {
    await notes.update(id, {body, updatedAt: Date.now()});
  },

  remove: (id: string) => notes.remove(id),
};
