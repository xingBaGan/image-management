import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('基础测试', () => {
  it('应该正常工作', () => {
    expect(true).toBe(true);
  });

  it('应该能渲染组件', () => {
    render(<div>测试组件</div>);
    expect(screen.getByText('测试组件')).toBeInTheDocument();
  });
}); 