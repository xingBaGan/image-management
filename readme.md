# atujii - Image Management Tool
[Chinese Version](readme.zh.md)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/xingBaGan/image-management)

A clean and elegant local image management tool to help you easily manage and organize your images and video resources.
Supports Windows, MacOS, Linux.
Could manage 100000+ images and videos with good performance.

<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114484282723113&bvid=BV1YGVZzqE9g&cid=29894836654&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

<iframe width="560" height="315" src="https://www.youtube.com/embed/xjbRYRC8cSY?si=Mzn4BUs32PSkZ4vg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## documentation

[https://deepwiki.com/xingBaGan/image-management](https://deepwiki.com/xingBaGan/image-management)

## Main Features

- Clean and intuitive user interface
- Fast browsing and management of large media collections
- Powerful categorization and tagging system
- Support for image and video previews
- AI automatic tagging functionality
- Random sorting and display feature
- Comprehensive keyboard shortcuts
- Optimized drag interaction

## User Guide
python 3.10+ is required.
node 20+ is required.

For installation instructions, see [install.en.md](install.en.md)

### Basic Operations

1. **Browse Media**
   - Switch View Mode: Click the grid/list icon in the toolbar
   - Sort: Click the sort button in the toolbar to choose sorting method (including the new random sorting feature)
   - View Large Image: Double-click any media to enlarge
   - Video Preview: Hover mouse over video to preview, move mouse to quickly preview different timestamps
   - Filter: Use the filter button in the toolbar to filter by file type, size, date, and other conditions
   - Random Display: Long press the sort button to activate random display feature

2. **Import Media**
   - Click the "Import" button in the toolbar
   - Or directly drag and drop files into the application window
   - Supports common image formats like jpg, jpeg, png, gif
   - Supports video formats like mp4, mov, avi, webm

3. **Manage Favorites**
   - Click the heart icon in the top right of media to favorite/unfavorite
   - Click "Favorites" in the sidebar to view all favorited content

### Category Management

1. **Create Category**
   - Click the "New Category" button at the bottom of the sidebar
   - Enter category name and confirm

2. **Edit Category**
   - Hover mouse over category to show edit button
   - Click edit button to modify category name
   - Click delete button to remove category

3. **Add Media to Category**
   - Select one or multiple media files
   - Click "Add to Category" button
   - Select target category to confirm addition
   - Category items display the count of currently selected images

### Batch Operations

1. **Select Media**
   - Click to select single media
   - Hold Shift and click to select a range
   - Hold mouse and drag in empty space to box select multiple media
   - Optimized dragging state management for smoother user experience

2. **Batch Operations**
   - Batch operation toolbar appears after selecting media
   - Support batch delete
   - Support batch add to category
   - Support batch add tags

### Using AI Features

1. **AI Tags**
   - Select one or multiple media files
   - Click "AI Tag" button in toolbar
   - Wait for AI to automatically recognize and add tags
   - Can manually edit and manage tags

2. **ComfyUI Integration**
   - Ensure ComfyUI is properly installed
   - Configure ComfyUI path in settings
   - Select media files to process
   - Choose preset workflow or import custom workflow
   - Execute processing

## Tech Stack

- Electron - Cross-platform desktop application framework
- React - User interface building
- TypeScript - Type-safe JavaScript
- Tailwind CSS - Atomic CSS framework
- Vite - Modern frontend build tool
- FFmpeg - Video processing
- Python - AI feature support
- ComfyUI - AI image processing
- pouchdb - Local database

## Development Guide

1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

2. Run in Development Mode

```bash
npm run electron:dev
```

3. Build

```bash
npm run electron:build --win
npm run electron:build --mac
npm run electron:build --linux
```

## Notes

- Current version: 0.4.12
- First run will create configuration file in user data directory
- Supported image formats: jpg, jpeg, png, gif
- Supported video formats: mp4, mov, avi, webm
- AI features require corresponding Python environment and dependencies
- ComfyUI features require proper ComfyUI environment configuration
- Regular backups of the configuration file (images.json) are recommended

## Future Plans

- [x] Image tag system
- [x] Video preview optimization
- [x] Image information viewing
- [x] Color classification support
- [x] Multi-language support
- [x] Shortcut key support
- [x] Main color extraction
- [x] Random sorting feature
- [ ] Extensible plugin system
   - [ ] Image editing features
   - [ ] More AI model integration
- [ ] ComfyUI integration - Support image processing through ComfyUI

## Contributing

Welcome to submit Issues and Pull Requests to help improve this project.

## License

This project is licensed under the [GNU General Public License v3.0](./LICENSE). 