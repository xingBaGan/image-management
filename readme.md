# atujii - Image Management Tool
[Chinese Version](readme.zh.md)

A clean and elegant local image management tool to help you easily manage and organize your images and video resources.
Supports Windows, MacOS, Linux.
Could manage 100000+ images and videos with good performance.


![](https://picgo-1300491698.cos.ap-nanjing.myqcloud.com/v0.4.1_3.png)
![](https://picgo-1300491698.cos.ap-nanjing.myqcloud.com/v0.4.1_1.png)
![](https://picgo-1300491698.cos.ap-nanjing.myqcloud.com/v0.4.1_2.png)
## Main Features


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

- First run will create configuration file in user data directory
- Supported image formats: jpg, jpeg, png, gif
- Supported video formats: mp4, mov, avi, webm
- AI features require corresponding Python environment and dependencies
- ComfyUI features require proper ComfyUI environment configuration

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

This project is licensed under the [GNU General Public License v3.0](./LICENSE). 