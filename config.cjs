const defaultModel = 'wd-v1-4-moat-tagger-v2';
const supportedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
const supportedVideoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
const supportedExtensions = supportedImageExtensions.concat(supportedVideoExtensions);
module.exports = {
  defaultModel,
  supportedExtensions,
  supportedImageExtensions,
  supportedVideoExtensions,
};
