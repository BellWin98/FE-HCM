import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutFeedItem } from '@/types';

/**
 * 이미지 확대 다이얼로그의 캐러셀 회귀 테스트.
 *
 * 과거 버그: `opts={{ startIndex: zoomImageIndex, loop: true }}` 처럼 현재 선택 인덱스를
 * 그대로 startIndex 에 물려 두면, 슬라이드를 넘길 때마다(select 이벤트 → setState)
 * embla 가 옵션 변경으로 인식해 캐러셀 전체를 reInit 한다. 그 결과 스와이프할 때마다
 * 캐러셀이 재초기화되면서 화면이 크게 튀었다.
 *
 * startIndex 는 다이얼로그를 여는 시점에만 결정되어야 하며, 이후 슬라이드 이동에는
 * 반응하지 않아야 한다.
 */

type EmblaSelectHandler = () => void;

const carouselOptsLog: unknown[] = [];
let selectHandlers: EmblaSelectHandler[] = [];
let currentSnap = 0;
let lastOpts: unknown;

const fakeApi = {
  selectedScrollSnap: () => currentSnap,
  on: (event: string, handler: EmblaSelectHandler) => {
    if (event === 'select') selectHandlers.push(handler);
  },
  off: (event: string, handler: EmblaSelectHandler) => {
    if (event === 'select') selectHandlers = selectHandlers.filter((h) => h !== handler);
  },
};

vi.mock('@/components/ui/carousel', () => ({
  Carousel: ({
    opts,
    setApi,
    children,
  }: {
    opts?: unknown;
    setApi?: (api: unknown) => void;
    children?: ReactNode;
  }) => {
    // 피드 목록의 캐러셀은 setApi 를 넘기지 않는다. 확대 다이얼로그 캐러셀만 추적한다.
    if (setApi) {
      // 실제 embla 는 새 옵션으로 초기화될 때 startIndex 위치에서 시작한다.
      // opts 참조가 바뀌었을 때만 반영해야 select 시뮬레이션이 리렌더에 덮어써지지 않는다.
      if (opts !== lastOpts) {
        lastOpts = opts;
        currentSnap = (opts as { startIndex?: number } | undefined)?.startIndex ?? 0;
      }
      carouselOptsLog.push(opts);
      setApi(fakeApi);
    }
    return <div data-testid="carousel">{children}</div>;
  },
  CarouselContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  CarouselNext: () => <button type="button">next</button>,
  CarouselPrevious: () => <button type="button">prev</button>,
}));

// mock 은 호이스팅되므로 컴포넌트는 mock 선언 이후에 가져온다.
const { WorkoutFeedSection } = await import('@/components/WorkoutFeedSection');

// "2 / 3" 카운터는 JSX 상 텍스트 노드가 쪼개져 있어 getByText 로 잡히지 않는다.
const readCounter = (): string | undefined =>
  Array.from(document.querySelectorAll('div'))
    .map((node) => node.textContent?.trim() ?? '')
    .filter((text) => /^\d+ \/ \d+$/.test(text))
    .at(-1);

const buildFeedItem = (): WorkoutFeedItem => ({
  id: 1,
  workoutDate: '2026-07-20',
  workoutTypes: ['헬스(가슴)'],
  duration: 60,
  imageUrls: ['a.jpg', 'b.jpg', 'c.jpg'],
  likes: 0,
  comments: 0,
  isLiked: false,
  createdAt: '2026-07-20T10:00:00',
});

describe('이미지 확대 캐러셀', () => {
  beforeEach(() => {
    carouselOptsLog.length = 0;
    selectHandlers = [];
    currentSnap = 0;
    lastOpts = undefined;
  });

  it('슬라이드를 넘겨도 startIndex 가 바뀌지 않아 embla 가 reInit 되지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <WorkoutFeedSection feed={[buildFeedItem()]} onFeedUpdate={() => {}} initialIsLastPage />,
    );

    // 두 번째 이미지를 눌러 확대 다이얼로그를 연다.
    await user.click(screen.getByAltText('헬스(가슴) 운동 2'));

    const optsAfterOpen = carouselOptsLog.at(-1) as { startIndex: number };
    expect(optsAfterOpen.startIndex).toBe(1);
    expect(readCounter()).toBe('2 / 3');

    // 캐러셀에서 세 번째 슬라이드로 이동한 상황을 재현한다.
    const optsCountBefore = carouselOptsLog.length;
    currentSnap = 2;
    await act(async () => {
      selectHandlers.forEach((handler) => handler());
    });

    // 카운터는 따라와야 한다.
    expect(readCounter()).toBe('3 / 3');

    // 리렌더가 발생했더라도 startIndex 는 열 때 값(1)을 유지해야 한다.
    expect(carouselOptsLog.length).toBeGreaterThan(optsCountBefore);
    for (const opts of carouselOptsLog.slice(optsCountBefore)) {
      expect((opts as { startIndex: number }).startIndex).toBe(1);
    }

    // opts 객체 자체도 동일 참조여야 embla 가 옵션 변경으로 오인하지 않는다.
    expect(carouselOptsLog.at(-1)).toBe(optsAfterOpen);
  });

  it('다른 기록의 이미지를 열면 새로운 startIndex 가 적용된다', async () => {
    const user = userEvent.setup();
    render(
      <WorkoutFeedSection feed={[buildFeedItem()]} onFeedUpdate={() => {}} initialIsLastPage />,
    );

    await user.click(screen.getByAltText('헬스(가슴) 운동 1'));
    expect((carouselOptsLog.at(-1) as { startIndex: number }).startIndex).toBe(0);

    await user.keyboard('{Escape}');
    await user.click(screen.getByAltText('헬스(가슴) 운동 3'));
    expect((carouselOptsLog.at(-1) as { startIndex: number }).startIndex).toBe(2);
  });
});
