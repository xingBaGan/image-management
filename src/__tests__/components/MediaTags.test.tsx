import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MediaTags from '@/components/MediaTags';
import { resolveCanonicalTagInput } from '@/services/tagTranslationService';

jest.mock('lucide-react', () => ({
  X: () => <svg data-testid="icon-x" />,
  Copy: () => <svg data-testid="icon-copy" />,
  Trash: () => <svg data-testid="icon-trash" />,
}));

jest.mock('@/utils', () => ({
  isArrayOfString: jest.fn(() => false),
}));

jest.mock('@/services/tagTranslationService', () => ({
  resolveCanonicalTagInput: jest.fn(),
  getTagHoverText: jest.requireActual('@/services/tagTranslationService').getTagHoverText,
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLocale: () => ({
    t: (key: string) => key,
    language: 'zh',
    setLanguage: jest.fn(),
  }),
}));

const mockResolveCanonicalTagInput =
  resolveCanonicalTagInput as jest.MockedFunction<typeof resolveCanonicalTagInput>;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('MediaTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves Chinese input to a canonical English tag before persisting on Enter', async () => {
    mockResolveCanonicalTagInput.mockResolvedValue('cat');
    const onTagsUpdate = jest.fn();

    render(<MediaTags tags={[]} mediaId="media-1" onTagsUpdate={onTagsUpdate} />);

    const input = screen.getByPlaceholderText('tagInput');
    fireEvent.change(input, { target: { value: '猫' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(mockResolveCanonicalTagInput).toHaveBeenCalledWith('猫');
      expect(onTagsUpdate).toHaveBeenCalledWith('media-1', ['cat']);
    });

    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.queryByText('猫')).not.toBeInTheDocument();
  });

  it('keeps chip text English while exposing the Chinese translation as hover text in Chinese mode', () => {
    render(
      <MediaTags
        tags={['cat']}
        displayTags={['猫']}
        mediaId="media-1"
        onTagsUpdate={jest.fn()}
      />
    );

    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.queryByText('猫')).not.toBeInTheDocument();
    expect(screen.getByText('cat').closest('div')).toHaveAttribute('title', '猫');
  });

  it('ignores a stale async Enter submission after clear removes all tags', async () => {
    const deferred = createDeferred<string>();
    mockResolveCanonicalTagInput.mockReturnValue(deferred.promise);
    const onTagsUpdate = jest.fn();

    render(
      <MediaTags
        tags={['dog']}
        mediaId="media-1"
        onTagsUpdate={onTagsUpdate}
        showClearButton
      />
    );

    const input = screen.getByPlaceholderText('tagInput');
    fireEvent.change(input, { target: { value: '猫' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    fireEvent.click(screen.getByLabelText('clearTags'));
    expect(onTagsUpdate).toHaveBeenLastCalledWith('media-1', []);

    deferred.resolve('cat');

    await waitFor(() => {
      expect(mockResolveCanonicalTagInput).toHaveBeenCalledWith('猫');
    });

    expect(onTagsUpdate).toHaveBeenCalledTimes(1);
    expect(onTagsUpdate).toHaveBeenLastCalledWith('media-1', []);
    expect(screen.queryByText('dog')).not.toBeInTheDocument();
    expect(screen.queryByText('cat')).not.toBeInTheDocument();
  });
});
