import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SearchBar from '@/components/Toolbar/SearchBar';
import { getTagFrequency } from '@/services/tagService';
import { resolveCanonicalTagInput } from '@/services/tagTranslationService';

jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="icon-search" />,
  X: () => <svg data-testid="icon-x" />,
}));

jest.mock('@/services/tagService', () => ({
  getTagFrequency: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/tagTranslationService', () => ({
  resolveCanonicalTagInput: jest.fn(),
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
const mockGetTagFrequency =
  getTagFrequency as jest.MockedFunction<typeof getTagFrequency>;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

function getSuggestionItem(text: string) {
  return screen
    .getAllByText(text)
    .map(element => element.closest('li'))
    .find((element): element is HTMLLIElement => element instanceof HTMLLIElement);
}

function renderStatefulSearchBar(
  initialTags: string[] = [],
  onSearch = jest.fn(),
  searchButtonRef = React.createRef<HTMLElement>()
) {
  const StatefulSearchBar = () => {
    const [tags, setTags] = React.useState(initialTags);
    return (
      <SearchBar
        onSearch={onSearch}
        searchButtonRef={searchButtonRef}
        tags={tags}
        setTags={setTags}
      />
    );
  };

  return {
    ...render(<StatefulSearchBar />),
    onSearch,
    searchButtonRef,
  };
}

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves Chinese input to canonical English before submitting on Enter', async () => {
    mockResolveCanonicalTagInput.mockResolvedValue('cat');
    const onSearch = jest.fn();
    const setTags = jest.fn();
    const searchButtonRef = React.createRef<HTMLElement>();

    render(
      <SearchBar
        onSearch={onSearch}
        searchButtonRef={searchButtonRef}
        tags={[]}
        setTags={setTags}
      />
    );

    fireEvent.click(screen.getByTitle('search(Ctrl+F)'));

    const input = screen.getByPlaceholderText('searchImages');
    fireEvent.change(input, { target: { value: '猫' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(mockResolveCanonicalTagInput).toHaveBeenCalledWith('猫');
      expect(setTags).toHaveBeenCalledWith(['cat']);
      expect(onSearch).toHaveBeenCalledWith(['cat']);
    });
  });

  it('keeps selected suggestions aligned with existing and newly submitted tags on Enter', async () => {
    mockGetTagFrequency.mockResolvedValue([
      { name: 'dog', times: 10 },
      { name: 'cat', times: 8 },
    ]);
    mockResolveCanonicalTagInput.mockResolvedValue('cat');
    const onSearch = jest.fn();
    const setTags = jest.fn();
    const searchButtonRef = React.createRef<HTMLElement>();

    render(
      <SearchBar
        onSearch={onSearch}
        searchButtonRef={searchButtonRef}
        tags={['dog']}
        setTags={setTags}
      />
    );

    const input = screen.getByPlaceholderText('pressEnterToAddTag');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '猫' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(mockResolveCanonicalTagInput).toHaveBeenCalledWith('猫');
      expect(setTags).toHaveBeenCalledWith(['dog', 'cat']);
      expect(onSearch).toHaveBeenCalledWith(['dog', 'cat']);
    });

    await waitFor(() => {
      expect(getSuggestionItem('dog')).toHaveClass('selected');
      expect(getSuggestionItem('cat')).toHaveClass('selected');
    });
  });

  it('ignores a stale async Enter submission after Escape clears the filters', async () => {
    const deferred = createDeferred<string>();
    mockResolveCanonicalTagInput.mockReturnValue(deferred.promise);
    const onSearch = jest.fn();
    const setTags = jest.fn();
    const searchButtonRef = React.createRef<HTMLElement>();

    render(
      <SearchBar
        onSearch={onSearch}
        searchButtonRef={searchButtonRef}
        tags={['dog']}
        setTags={setTags}
      />
    );

    const input = screen.getByPlaceholderText('pressEnterToAddTag');
    fireEvent.change(input, { target: { value: '猫' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape', charCode: 27 });

    expect(setTags).toHaveBeenCalledWith([]);
    expect(onSearch).toHaveBeenLastCalledWith([]);

    deferred.resolve('cat');

    await waitFor(() => {
      expect(mockResolveCanonicalTagInput).toHaveBeenCalledWith('猫');
    });

    expect(setTags).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenLastCalledWith([]);
  });

  it('drops the filter from both tag state and onSearch when deselecting a selected suggestion', async () => {
    mockGetTagFrequency.mockResolvedValue([{ name: 'cat', times: 8 }]);
    mockResolveCanonicalTagInput.mockResolvedValue('cat');
    const onSearch = jest.fn();

    renderStatefulSearchBar([], onSearch);

    fireEvent.click(screen.getByTitle('search(Ctrl+F)'));

    const input = screen.getByPlaceholderText('searchImages');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '猫' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith(['cat']);
      expect(getSuggestionItem('cat')).toHaveClass('selected');
    });

    fireEvent.mouseDown(getSuggestionItem('cat')!);

    await waitFor(() => {
      expect(onSearch).toHaveBeenLastCalledWith([]);
    });

    expect(getSuggestionItem('cat')).not.toHaveClass('selected');
  });

  it('does not clear newer typed input when an older async Enter submit resolves', async () => {
    const deferred = createDeferred<string>();
    mockResolveCanonicalTagInput.mockReturnValue(deferred.promise);

    renderStatefulSearchBar();

    fireEvent.click(screen.getByTitle('search(Ctrl+F)'));

    const input = screen.getByPlaceholderText('searchImages') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '猫' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    fireEvent.change(input, { target: { value: 'bird' } });
    expect(input.value).toBe('bird');

    deferred.resolve('cat');

    await waitFor(() => {
      expect(mockResolveCanonicalTagInput).toHaveBeenCalledWith('猫');
    });

    expect(input.value).toBe('bird');
  });
});
