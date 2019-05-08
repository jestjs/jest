import serializer from 'jest-serializer';
import {InternalHasteMap, Persistence} from '../types';

class FilePersistence implements Persistence {
  write(cachePath: string, internalHasteMap: InternalHasteMap): void {
    serializer.writeFileSync(cachePath, internalHasteMap);
  }

  read(cachePath: string): InternalHasteMap {
    return serializer.readFileSync<InternalHasteMap>(cachePath);
  }

  getType() {
    return 'file';
  }
}

export default new FilePersistence();
