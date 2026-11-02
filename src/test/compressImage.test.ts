import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressImage, fitToMaxWidth } from '@/lib/compressImage';

describe('fitToMaxWidth', () => {
  it('최대 너비 이하면 그대로 둔다', () => {
    expect(fitToMaxWidth(1080, 8000)).toEqual({ width: 1080, height: 8000 });
  });

  it('최대 너비를 넘으면 비율을 유지해 줄인다', () => {
    expect(fitToMaxWidth(2880, 1800)).toEqual({ width: 1440, height: 900 });
    expect(fitToMaxWidth(3000, 20000)).toEqual({ width: 1440, height: 9600 });
  });
});

describe('compressImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const makeFile = (type: string, name = 'photo.png', size = 1000): File =>
    new File([new Uint8Array(size)], name, { type });

  const calls: string[] = [];

  const stubCanvas = (blobSize: number): void => {
    calls.length = 0;
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 2880, height: 1800, close: vi.fn() }));
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        getContext(): { fillStyle: string; fillRect: () => void; drawImage: () => void } {
          return {
            fillStyle: '',
            fillRect: () => calls.push('fillRect'),
            drawImage: () => calls.push('drawImage'),
          };
        }
        convertToBlob(): Promise<Blob> {
          return Promise.resolve(new Blob([new Uint8Array(blobSize)], { type: 'image/jpeg' }));
        }
      },
    );
  };

  it('GIF는 같은 객체를 돌려준다', async () => {
    const gif = makeFile('image/gif', 'a.gif');
    expect(await compressImage(gif)).toBe(gif);
  });

  it('디코딩에 실패하면 원본을 돌려준다', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode')));
    const file = makeFile('image/png');
    expect(await compressImage(file)).toBe(file);
  });

  it('인코딩 결과가 원본보다 크면 원본을 돌려준다', async () => {
    stubCanvas(5000);
    const file = makeFile('image/png', 'photo.png', 1000);
    expect(await compressImage(file)).toBe(file);
  });

  it('성공하면 .jpg 이름의 image/jpeg 파일을 돌려준다', async () => {
    stubCanvas(200);
    const result = await compressImage(makeFile('image/png', 'my.photo.png', 1000));
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('my.photo.jpg');
    expect(result.size).toBe(200);
  });

  it('JPEG 로 바꾸기 전에 흰 배경을 먼저 칠한다(투명 PNG 가 검게 되지 않게)', async () => {
    stubCanvas(200);
    await compressImage(makeFile('image/png', 'a.png', 1000));
    expect(calls).toEqual(['fillRect', 'drawImage']);
  });

  it('DOM 캔버스 경로에서도 흰 배경을 먼저 칠한다', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 100, height: 100, close: vi.fn() }));
    const order: string[] = [];
    const ctx = {
      fillStyle: '',
      fillRect: () => order.push('fillRect'),
      drawImage: () => order.push('drawImage'),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(new Blob([new Uint8Array(10)])));
    await compressImage(makeFile('image/png', 'a.png', 1000));
    expect(order).toEqual(['fillRect', 'drawImage']);
    expect(ctx.fillStyle).toBe('#fff');
  });
});
