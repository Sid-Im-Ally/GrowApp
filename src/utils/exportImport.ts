import type { Book } from '../types';

export function exportToJSON(books: Book[]): void {
  const json = JSON.stringify(books, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `grow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importFromJSON(file: File): Promise<Book[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed)) {
          reject(new Error('Invalid backup file: expected an array of books.'));
          return;
        }
        // Basic shape validation on the first item
        const valid = parsed.every(
          (b: any) => typeof b.id === 'string' && typeof b.title === 'string'
        );
        if (!valid) {
          reject(new Error('Invalid backup file: books are missing required fields.'));
          return;
        }
        resolve(parsed as Book[]);
      } catch {
        reject(new Error('Could not parse the file. Make sure it is a valid JSON backup.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
