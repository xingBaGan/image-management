import { imageCountManager } from "./FileService.cjs";
import { logger } from "./logService.cjs";

const MAX_IMAGE_COUNT = 10000;

function isReadFromDB(): boolean {
  const count = imageCountManager.getCount();
  // logger.info(`image count: ${count}`);
  return count > MAX_IMAGE_COUNT;
}

export {
    isReadFromDB,
    MAX_IMAGE_COUNT
}