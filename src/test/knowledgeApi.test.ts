import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';

/** 지식 메모 목록 조회가 scopes 를 반복 파라미터로 실어 보내는지 확인한다. */

const spyRequest = () =>
  vi.spyOn(api, 'request').mockResolvedValue({ content: [], last: true, number: 0 });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api.searchKnowledgeNotes', () => {
  it('searchKnowledgeNotes_appendsEachScope', async () => {
    const request = spyRequest();

    await api.searchKnowledgeNotes({ scopes: ['MINE', 'PRIVATE'] });

    expect(request).toHaveBeenCalledWith('/knowledge-notes?scopes=MINE&scopes=PRIVATE');
  });

  it('searchKnowledgeNotes_emptyScopes_omitsParam', async () => {
    const request = spyRequest();

    await api.searchKnowledgeNotes({ scopes: [] });

    const url = request.mock.calls[0][0] as string;
    expect(url).not.toContain('scopes');
  });
});
