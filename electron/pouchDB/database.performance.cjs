const { performance, PerformanceObserver } = require('perf_hooks');
const { getTestDBInstance} = require('./Database.cjs');

// 设置性能观察器
const perfObserver = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
perfObserver.observe({ entryTypes: ["measure"] });

class PerformanceTest {
  static async measureTime(name, fn) {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000; // 转换为毫秒
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static async runTests() {
    console.log('🚀 开始性能测试 (使用内存数据库)...\n');
    
    // 创建测试数据库实例
    const db = getTestDBInstance();
    const results = {};
    const tags = ['test', 'tag-0', 'tag-1', 'tag-2', 'tag-3', 'tag-4', 'tag-5', 'tag-6', 'tag-7', 'tag-8', 'tag-9'];
    try {
      // 测试创建操作
      console.log('📝 测试图片创建操作...');
      results.create = await this.measureTime('创建 10000 张图片', async () => {
        const promises = Array(10000).fill(null).map((_, i) => db.createImage({
          id: `test-${i}`,
          path: `/test/path-${i}`,
          name: `test-${i}.jpg`,
          extension: 'jpg',
          size: Math.floor(Math.random() * 1000000) + 1024, // 随机文件大小
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          tags: [tags[i % 10]], // 一些重复的标签
          favorite: i % 5 === 0, // 每5个一个收藏
          categories: [],
          type: 'image',
          width: 1920,
          height: 1080,
          rating: Math.floor(Math.random() * 6), // 0-5星评级
          colors: [
            { color: '#FF5733', percentage: 0.3 },
            { color: '#33FF57', percentage: 0.7 }
          ],
          isBindInFolder: false
        }));
        await Promise.all(promises);
      });

      // 测试查询操作
      console.log('\n🔍 测试图片查询操作...');
      results.queryAll = await this.measureTime('查询所有图片', async () => {
        await db.getAllImages();
      });

      // 测试单个图片查询
      results.querySingle = await this.measureTime('查询单张图片', async () => {
        await db.getImage('test-50');
      });

      // 测试复杂过滤查询
      results.queryFiltered = await this.measureTime('复杂过滤查询', async () => {
        await db.filterAndSortImagesFromDB({
          filter: 'all',
          selectedCategory: 'photos',
          categories: [],
          searchTags: [tags[0]],
          filterColors: [],
          multiFilter: {
            ratio: [],
            rating: 0,
            formats: ['jpg'],
            precision: 0.8
          },
          sortBy: 'date',
          sortDirection: 'desc'
        });
      });

      // 测试批量查询
      console.log('\n📊 测试批量查询操作...');
      results.queryBatch = await this.measureTime('批量查询 10 张图片', async () => {
        const promises = Array(10).fill(null).map((_, i) => db.getImage(`test-${i}`));
        await Promise.all(promises);
      });

      // 计算一些性能指标
      console.log('\n📈 性能分析:');
      console.log(`- 平均创建单张图片耗时: ${(results.create / 100).toFixed(2)}ms`);
      console.log(`- 查询效率: ${(results.queryAll).toFixed(2)}ms (100张图片)`);
      console.log(`- 单图片查询: ${results.querySingle.toFixed(2)}ms`);
      console.log(`- 复杂查询: ${results.queryFiltered.toFixed(2)}ms`);
      console.log(`- 平均批量查询: ${(results.queryBatch / 10).toFixed(2)}ms/张`);

    } finally {
      // 清理测试数据库
      await db.destroyDatabase();
      console.log('\n🧹 测试数据库已清理');
    }

    return results;
  }
}

// 运行测试
PerformanceTest.runTests()
  .then(results => {
    console.log('\n✅ 性能测试完成!');
    console.log('\n最终结果:', results, '单位: 毫秒');
  })
  .catch(error => {
    console.error('\n❌ 测试失败:', error);
  });