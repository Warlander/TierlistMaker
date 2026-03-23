import { AppState } from './types.js';

interface SaveFile {
  version: 1;
  tiers: AppState['tiers'];
  unranked: AppState['unranked'];
}

export function saveToFile(state: AppState): void {
  const payload: SaveFile = {
    version: 1,
    tiers: state.tiers,
    unranked: state.unranked,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'tierlist.json';
  a.click();

  URL.revokeObjectURL(url);
}

export function loadFromFile(): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string) as Partial<SaveFile>;

          if (parsed.version !== 1) {
            reject(new Error(`Unsupported file version: ${parsed.version}`));
            return;
          }

          if (!Array.isArray(parsed.tiers) || !Array.isArray(parsed.unranked)) {
            reject(new Error('Invalid file format'));
            return;
          }

          resolve({ tiers: parsed.tiers, unranked: parsed.unranked });
        } catch {
          reject(new Error('Failed to parse file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };

    input.click();
  });
}
