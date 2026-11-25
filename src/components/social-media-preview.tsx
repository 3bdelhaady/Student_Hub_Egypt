export function SocialMediaPreview({
  kind,
  src,
  name,
}: {
  kind: string;
  src: string;
  name?: string | null;
}) {
  return (
    <figure style={{ margin: 0, maxWidth: '100%' }}>
      {kind === 'image' ? (
        <img
          src={src}
          alt={name || 'صورة المنشور'}
          style={{ display: 'block', maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }}
        />
      ) : (
        <video
          src={src}
          controls
          preload="metadata"
          aria-label={name || 'فيديو المنشور'}
          style={{ display: 'block', width: '100%', maxHeight: 360 }}
        />
      )}
      <figcaption>{name}</figcaption>
    </figure>
  );
}
