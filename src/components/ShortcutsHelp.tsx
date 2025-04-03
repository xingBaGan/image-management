import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';
import MarkdownPreview from '@uiw/react-markdown-preview';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcutsMarkdown = `# Keyboard Shortcuts 键盘快捷键

## Navigation & Selection 导航和选择
| Shortcut 快捷键 | Action 操作 | Description 描述 |
|----------------|-------------|-----------------|
| \`Tab\` | Next Image 下一张图片 | Switch to next image when one image is selected 当选中单张图片时切换到下一张 |
| \`Shift + Tab\` | Previous Image 上一张图片 | Switch to previous image when one image is selected 当选中单张图片时切换到上一张 |
| \`Esc\` | Deselect 取消选择 | Clear all selected images 取消所有已选择的图片 |

## File Operations 文件操作

| Shortcut 快捷键 | Action 操作 | Description 描述 |
|----------------|-------------|-----------------|
| \`Delete\` | Delete Selected 删除选中 | Delete selected image(s) 删除选中的图片 |
| \`Ctrl/⌘ + E\` | Open in Editor 在编辑器中打开 | Open selected image in external editor 在外部编辑器中打开选中的图片 |

## View Controls 视图控制

| Shortcut 快捷键 | Action 操作 | Description 描述 |
|----------------|-------------|-----------------|
| \`Ctrl/⌘ + G\` | Toggle View Mode 切换视图模式 | Switch between grid and list view 在网格视图和列表视图之间切换 |
| \`Ctrl/⌘ + F\` | Search 搜索 | Open search box 打开搜索框 |
| \`Ctrl/⌘ + S\` | Sort 排序 | Toggle sort options popup 切换排序选项弹窗 |
| \`Ctrl/⌘ + R\` | Filter 筛选 | Toggle filter options popup 切换筛选选项弹窗 |

## Selection Tools 选择工具

| Shortcut 快捷键 | Action 操作 | Description 描述 |
|----------------|-------------|-----------------|
| \`Ctrl/⌘ + A\` | Select All 全选 | Select all visible images 选择所有可见图片 |

## Image Management 图片管理

| Shortcut 快捷键 | Action 操作 | Description 描述 |
|----------------|-------------|-----------------|
| \`Ctrl/⌘ + H\` | Toggle Favorite 切换收藏 | Add/Remove from favorites 添加/移除收藏 |

> Note: On macOS, use \`⌘\` (Command) instead of \`Ctrl\`
> 注意：在 macOS 上使用 \`⌘\` (Command) 键代替 \`Ctrl\` 键`;

const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const { t } = useLocale();

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm transition-all duration-200 bg-black/60">
      <div className="relative w-[900px] max-h-[85vh] bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl overflow-hidden border border-gray-200  transform transition-all duration-200 dark:text-white">
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b dark:from-gray-800 dark:to-gray-750 dark:text-white">
          <div className="flex items-center space-x-3">
            <Keyboard className="w-6 h-6 text-blue-400 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {t('shortcuts.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 rounded-lg transition-colors duration-200 hover:text-gray-700 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/80"
            title={t('close')}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-5rem)] custom-scrollbar">
          <MarkdownPreview
            className='markdown-preview'
            source={shortcutsMarkdown}
            wrapperElement={{
              "data-color-mode": "light"
            }}
            style={{
              backgroundColor: 'transparent',
              fontSize: '14px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelp; 