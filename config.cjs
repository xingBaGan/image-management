const defaultModel = 'wd-v1-4-moat-tagger-v2';
const supportModes = [
  'wd-v1-4-moat-tagger-v2',
  'wd-v1-4-convnext-tagger-v2',
  'wd-v1-4-convnextv2-tagger-v2',
];
const supportedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const supportedVideoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
const supportedExtensions = supportedImageExtensions.concat(supportedVideoExtensions);
module.exports = {
  defaultModel,
  supportedExtensions,
  supportedImageExtensions,
  supportedVideoExtensions,
  supportModes,
};
