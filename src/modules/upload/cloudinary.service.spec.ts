import { CloudinaryService } from './cloudinary.service';

describe('Avatar input validation', () => {
  const config = { get: () => undefined };
  it('rejects SVG payloads even when their declared MIME type says JPEG', async () => {
    const service = new CloudinaryService(config as any);
    const buffer = Buffer.from('<svg><script>test</script></svg>');
    await expect(service.uploadAvatar({ buffer, size: buffer.length, mimetype: 'image/jpeg' } as any, 'user'))
      .rejects.toMatchObject({ status: 400 });
  });
  it('rejects images larger than 10 MB before calling the provider', async () => {
    const service = new CloudinaryService(config as any);
    const buffer = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    await expect(service.uploadAvatar({ buffer, size: 10 * 1024 * 1024 + 1, mimetype: 'image/png' } as any, 'user'))
      .rejects.toMatchObject({ status: 400 });
  });
});
