import Image from "next/image";

import { image, type MarketingImageKey } from "@/config/images";
import { cn } from "@/lib/utils";

/**
 * next/image wrapper bound to the generated marketing manifest so intrinsic
 * dimensions, sizes and blur placeholders are never hand-maintained.
 */
export function MarketingImage({
  imageKey,
  alt,
  sizes,
  priority,
  fill,
  className,
  imageClassName,
  quality = 82,
}: {
  imageKey: MarketingImageKey;
  alt: string;
  sizes: string;
  priority?: boolean;
  fill?: boolean;
  className?: string;
  imageClassName?: string;
  quality?: number;
}) {
  const asset = image(imageKey);

  if (fill) {
    return (
      <Image
        src={asset.src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder="blur"
        blurDataURL={asset.blurDataURL}
        className={cn("object-cover", imageClassName ?? className)}
      />
    );
  }

  return (
    <Image
      src={asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      sizes={sizes}
      priority={priority}
      quality={quality}
      placeholder="blur"
      blurDataURL={asset.blurDataURL}
      className={cn("h-auto w-full", className)}
    />
  );
}
