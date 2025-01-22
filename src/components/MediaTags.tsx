import React, { useState } from 'react';
import { Tag, X, Plus, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import TagEditDialog from './TagEditDialog';
import { StrictModeDroppable } from './StrictModeDroppable';
import { DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';

interface MediaTagsProps {
  tags: string[];
  mediaId: string;
  onTagsUpdate: (mediaId: string, newTags: string[]) => void;
}

const MediaTags: React.FC<MediaTagsProps> = ({
  tags,
  mediaId,
  onTagsUpdate,
}) => {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleTagDelete = (tagToDelete: string) => {
    const newTags = tags.filter(tag => tag !== tagToDelete);
    onTagsUpdate(mediaId, newTags);
  };

  const handleTagEdit = (oldTag: string) => {
    setEditingTag(oldTag);
  };

  const handleTagEditConfirm = (newTag: string) => {
    if (!editingTag) return;
    const newTags = tags.map(tag => tag === editingTag ? newTag : tag);
    onTagsUpdate(mediaId, newTags);
    setEditingTag(null);
  };

  const handleAddTag = (newTag: string) => {
    if (!tags.includes(newTag)) {
      const newTags = [...tags, newTag];
      onTagsUpdate(mediaId, newTags);
    }
    setIsAddingTag(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    if (
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    ) {
      return;
    }

    const newTags = [...tags];
    const [reorderedTag] = newTags.splice(result.source.index, 1);
    newTags.splice(result.destination.index, 0, reorderedTag);

    onTagsUpdate(mediaId, newTags);
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsAddingTag(true);
        }}
        className="px-3 py-1 bg-blue-500 text-white rounded-full flex items-center gap-1.5 text-sm hover:bg-blue-600 transition-colors"
        title="添加标签"
        aria-label="添加标签"
      >
        <Plus size={14} />
      </button>
      
      {tags && tags.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <StrictModeDroppable droppableId={`tags-${mediaId}`} direction="horizontal">
            {(provided: DroppableProvided, droppableSnapshot: DroppableStateSnapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-wrap gap-2 justify-center"
              >
                {tags.map((tag, index) => {
                  const dragId = `${tag}-${mediaId}-${index}`;
                  return (
                    <Draggable 
                      key={dragId}
                      draggableId={dragId}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            transition: snapshot.isDragging ? undefined : 'all 0.2s ease',
                            transform: provided.draggableProps.style?.transform,
                          }}
                          className={`px-3 py-1 bg-white/10 text-white rounded-full flex items-center gap-1.5 text-sm group
                            ${snapshot.isDragging ? 'opacity-90 scale-105 shadow-lg bg-blue-500/30 z-50' : ''}
                          `}
                        >
                          <div 
                            {...provided.dragHandleProps} 
                            className="p-1 rounded cursor-grab hover:bg-white/10"
                            style={{
                              cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                            }}
                          >
                            <GripVertical size={14} className="text-gray-400" />
                          </div>
                          <Tag size={14} />
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagEdit(tag);
                            }}
                          >
                            {tag}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagDelete(tag);
                            }}
                            className="ml-[0.1rem] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                            title="删除标签"
                            aria-label={`删除标签 ${tag}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </StrictModeDroppable>
        </DragDropContext>
      )}

      {editingTag && (
        <TagEditDialog
          isOpen={true}
          onClose={() => setEditingTag(null)}
          onConfirm={handleTagEditConfirm}
          initialTag={editingTag}
        />
      )}

      {isAddingTag && (
        <TagEditDialog
          isOpen={true}
          onClose={() => setIsAddingTag(false)}
          onConfirm={handleAddTag}
          initialTag=""
        />
      )}
    </div>
  );
};

export default MediaTags; 