import { lock, unlock } from 'proper-lockfile';

export async function lockFile(filePath: string): Promise<() => Promise<void>> {
  try {
    const release = await lock(filePath);
    // console.log(`文件锁获取成功: ${filePath}`);
    return release;
  } catch (error) {
    // console.error(`获取文件锁失败: ${filePath}`, error);
    throw error;
  }
}

export async function unlockFile(filePath: string): Promise<void> {
  try {
    await unlock(filePath);
    // console.log('文件锁释放成功');
  } catch (error) {
    // console.error('文件锁释放失败', error);
    throw error;
  }
} 