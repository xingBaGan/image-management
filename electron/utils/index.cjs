const generateHashId = (filePath, fileSize) => {
    const str = `${filePath}-${fileSize}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

module.exports = {
    generateHashId,
}