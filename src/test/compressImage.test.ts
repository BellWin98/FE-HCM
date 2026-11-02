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

  const stubCanvas = (blobSize: number): void => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 2880, height: 1800, close: vi.fn() }));
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        getContext(): { drawImage: () => void } {
          return { drawImage: vi.fn() };
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
});
