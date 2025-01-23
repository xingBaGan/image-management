import { useEffect, useState } from 'react';
import { Droppable, DroppableProps, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';

type StrictModeDroppableProps = Omit<DroppableProps, 'children'> & {
  children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement;
};

export const StrictModeDroppable = ({
  children,
  direction = 'vertical',
  type = 'DEFAULT',
  ...props
}: StrictModeDroppableProps) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // 在组件挂载后启用拖放功能
    const animation = requestAnimationFrame(() => setEnabled(true));

    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <Droppable direction={direction} type={type} {...props}>
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => children(provided, snapshot)}
    </Droppable>
  );
}; 