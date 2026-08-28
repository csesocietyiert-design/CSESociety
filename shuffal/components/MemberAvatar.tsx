'use client';

import { useState } from 'react';

interface MemberAvatarProps {
  name?: string | null;
  profileImage?: string | null;
  className: string;
  imageClassName?: string;
  alt?: string;
}

export default function MemberAvatar({
  name,
  profileImage,
  className,
  imageClassName = 'h-full w-full object-cover',
  alt,
}: MemberAvatarProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const firstLetter = name?.charAt(0)?.toUpperCase() || 'U';
  const displayImage = getDisplayImageUrl(profileImage);
  const usableImage = Boolean(displayImage) && failedImage !== displayImage;

  return (
    <div className={className}>
      {usableImage ? (
        // The URL comes directly from membership and may be hosted by Google Drive.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayImage as string}
          alt={alt || name || 'Member profile'}
          className={imageClassName}
          onError={() => setFailedImage(displayImage as string)}
        />
      ) : (
        firstLetter
      )}
    </div>
  );
}

function getDisplayImageUrl(profileImage?: string | null) {
  if (!profileImage?.trim()) return null;

  try {
    const url = new URL(profileImage);
    if (url.hostname === 'drive.google.com') {
      const fileId = url.searchParams.get('id');
      if (fileId) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w400`;
    }
  } catch {
    return profileImage;
  }

  return profileImage;
}
