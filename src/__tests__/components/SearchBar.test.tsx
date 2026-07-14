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

function getSuggestionItem(text: string) {
  return screen
    .getAllByText(text)
    .map(element => element.closest('li'))
    .find((element): element is HTMLLIElement => element instanceof HTMLLIElement);
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
});
