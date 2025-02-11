# atujii - Image Management Tool
[Chinese Version](readme.zh.md)

A clean and elegant local image management tool to help you easily manage and organize your images and video resources.


Image Management
![](https://picgo-1300491698.cos.ap-nanjing.myqcloud.com/v.3.0-1.png)

![](https://picgo-1300491698.cos.ap-nanjing.myqcloud.com/v.0.3.0-2.png)

Video Management
![](https://picgo-1300491698.cos.ap-nanjing.myqcloud.com/v.0.3.0-3.png)

## Main Features

### Media Management
- [x] Image Browsing - Supports grid view and list view
- [x] Image Favorites - One-click to favorite images
- [x] Image Classification - Flexible classification management system
- [x] Media Import - Supports batch import of local images and videos
   - [x] Folder import
   - [x] Drag and drop import
- [x] Media Search - Search by name and tags
- [x] Video Support 
  - [x] Video preview and playback
  - [x] Smart thumbnail generation
  - [x] Mouse hover preview
  - [x] Video timeline preview
- [x] Batch Operations - Supports batch delete, classify, and other operations
- [x] AI Tags - Supports automatic AI tagging for images

### Classification Features
- [x] Smart Classification - Built-in Recent, Images, Favorites, Videos, and other smart categories
- [x] Custom Classification - Support creating, editing, and deleting custom categories
- [x] Category Management - Support adding media to multiple categories
- [x] Tag System - Support adding multiple tags to media

### Interface Features
- [x] Dual View Mode - Switch between grid view and list view
- [x] Sorting Function - Sort by name, date, size
- [x] Dark Theme - Auto-adapts to system dark mode
- [x] Responsive Design - Perfect adaptation to various screen sizes
- [x] Drag and Drop Support - Support drag and drop media file import
- [x] Box Selection - Support box selection of multiple media files
- [x] Custom Background Image

### AI Features
- [x] AI Auto-tagging - Use deep learning models to automatically identify image content and add tags
- [x] ComfyUI Workflow - Support custom ComfyUI workflows for image processing
- [x] Batch Processing - Support batch AI tag recognition
- [x] Tag Management - Support editing and managing AI-generated tags

## User Guide

For installation instructions, see [install.en.md](install.en.md)

### Basic Operations

1. **Browse Media**
   - Switch View Mode: Click the grid/list icon in the toolbar
   - Sort: Click the sort button in the toolbar to choose sorting method
   - View Large Image: Double-click any media to enlarge
   - Video Preview: Hover mouse over video to preview, move mouse to quickly preview different timestamps
   - Filter: Use the filter button in the toolbar to filter by file type, size, date, and other conditions

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

### Batch Operations

1. **Select Media**
   - Click to select single media
   - Hold Shift and click to select a range
   - Hold mouse and drag in empty space to box select multiple media

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

- First run will create configuration file in user data directory
- Supported image formats: jpg, jpeg, png, gif
- Supported video formats: mp4, mov, avi, webm
- AI features require corresponding Python environment and dependencies
- ComfyUI features require proper ComfyUI environment configuration
- Recommended to regularly backup configuration file (images.json)

## Future Plans

- [x] Image tag system
- [x] Video preview optimization
- [x] Image information viewing
- [x] Color classification support
- [x] Multi-language support
- [x] Shortcut key support
- [ ] Extensible plugin system
   - [ ] Image editing features
   - [ ] More AI model integration
- [ ] ComfyUI integration - Support image processing through ComfyUI

## Contributing

Welcome to submit Issues and Pull Requests to help improve this project.

## License

MIT License 

## 许可证

本项目采用 [GNU General Public License v3.0](./LICENSE) 开源许可证。 