import { ImageDAO } from '../ImageDAO.cjs';
import { Image, QueryOptions } from '../type';
import { loadImagesData, saveImagesAndCategories } from '../../services/FileService.cjs';

export default class FileSystemImageDAO implements ImageDAO {
  private async getImagesAndCategories() {
    const data = await loadImagesData();
    return data;
  }

  async create(image: Image): Promise<Image> {
    const { images, categories } = await this.getImagesAndCategories();
    images.push(image);
    await saveImagesAndCategories(images, categories);
    return image;
  }

  async update(image: Image): Promise<Image> {
    const { images, categories } = await this.getImagesAndCategories();
    const index = images.findIndex(img => img.id === image.id);
    if (index !== -1) {
      images[index] = { ...images[index], ...image };
      await saveImagesAndCategories(images, categories);
    }
    return image;
  }

  async delete(id: string): Promise<boolean> {
    const { images, categories } = await this.getImagesAndCategories();
    const index = images.findIndex(img => img.id === id);
    if (index !== -1) {
      images.splice(index, 1);
      // 同时从所有分类中移除该图片
      categories.forEach(category => {
        category.images = category.images.filter((imgId: string) => imgId !== id);
        category.count = category.images.length;
      });
      await saveImagesAndCategories(images, categories);
      return true;
    }
    return false;
  }

  async get(id: string): Promise<Image | null> {
    const { images } = await this.getImagesAndCategories();
    return images.find(img => img.id === id) || null;
  }

  async bulkCreate(images: Image[]): Promise<Image[]> {
    const { images: existingImages, categories } = await this.getImagesAndCategories();
    existingImages.push(...images);
    await saveImagesAndCategories(existingImages, categories);
    return images;
  }

  async bulkUpdate(images: Image[]): Promise<Image[]> {
    const { images: existingImages, categories } = await this.getImagesAndCategories();
    images.forEach(image => {
      const index = existingImages.findIndex(img => img.id === image.id);
      if (index !== -1) {
        existingImages[index] = { ...existingImages[index], ...image };
      }
    });
    await saveImagesAndCategories(existingImages, categories);
    return images;
  }

  async bulkDelete(ids: string[]): Promise<boolean> {
    const { images, categories } = await this.getImagesAndCategories();
    const filteredImages = images.filter(img => !ids.includes(img.id));
    // 从所有分类中移除这些图片
    categories.forEach(category => {
      category.images = category.images.filter((imgId: string) => !ids.includes(imgId));
      category.count = category.images.length;
    });
    await saveImagesAndCategories(filteredImages, categories);
    return true;
  }

  async query(options?: QueryOptions): Promise<Image[]> {
    const { images } = await this.getImagesAndCategories();
    let result = [...images];

    if (options?.sort) {
      result.sort((a: any, b: any) => {
        const order = options.sort!.order === 'asc' ? 1 : -1;
        return (a[options.sort!.field] > b[options.sort!.field] ? 1 : -1) * order;
      });
    }

    if (options?.skip) {
      result = result.slice(options.skip);
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  async findByCategory(categoryId: string): Promise<Image[]> {
    const { images } = await this.getImagesAndCategories();
    return images.filter(img => img.categories.includes(categoryId));
  }

  async findByTags(tags: string[]): Promise<Image[]> {
    const { images } = await this.getImagesAndCategories();
    return images.filter(img => tags.some(tag => img.tags.includes(tag)));
  }

  async findByPath(path: string): Promise<Image | null> {
    const { images } = await this.getImagesAndCategories();
    return images.find(img => img.path === path) || null;
  }

  async updateTags(id: string, tags: string[]): Promise<Image> {
    const { images, categories } = await this.getImagesAndCategories();
    const index = images.findIndex(img => img.id === id);
    if (index !== -1) {
      images[index].tags = tags;
      await saveImagesAndCategories(images, categories);
      return images[index];
    }
    throw new Error('Image not found');
  }

  async updateCategories(id: string, categoryIds: string[]): Promise<Image> {
    const { images, categories } = await this.getImagesAndCategories();
    const index = images.findIndex(img => img.id === id);
    if (index !== -1) {
      images[index].categories = categoryIds;
      await saveImagesAndCategories(images, categories);
      return images[index];
    }
    throw new Error('Image not found');
  }

  async toggleFavorite(id: string): Promise<Image> {
    const { images, categories } = await this.getImagesAndCategories();
    const index = images.findIndex(img => img.id === id);
    if (index !== -1) {
      images[index].favorite = !images[index].favorite;
      await saveImagesAndCategories(images, categories);
      return images[index];
    }
    throw new Error('Image not found');
  }

  async updateMetadata(id: string, metadata: Partial<Image>): Promise<Image> {
    const { images, categories } = await this.getImagesAndCategories();
    const index = images.findIndex(img => img.id === id);
    if (index !== -1) {
      images[index] = { ...images[index], ...metadata };
      await saveImagesAndCategories(images, categories);
      return images[index];
    }
    throw new Error('Image not found');
  }
}