"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { GalleryPhoto } from "../server/photos";

type PhotoGalleryProps = {
  photos: GalleryPhoto[];
};

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedPhoto]);

  return (
    <>
      <div className="photo-grid" aria-label="Ganapati festival photo gallery">
        {photos.map((photo, index) => (
          <button
            className={`photo-card photo-card-${photo.aspect}`}
            key={photo.id}
            type="button"
            onClick={() => setSelectedPhoto(photo)}
            aria-label={`Open photo: ${photo.caption}`}
          >
            <span className="photo-frame">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                priority={index < 2}
                unoptimized={photo.source === "drive"}
              />
            </span>
            <span className="photo-caption">
              <span>{photo.caption}</span>
              <small>{photo.credit}</small>
            </span>
          </button>
        ))}
      </div>

      {selectedPhoto ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.caption}
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="lightbox-close"
            type="button"
            onClick={() => setSelectedPhoto(null)}
            aria-label="Close photo viewer"
          >
            x
          </button>
          <figure
            className="lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
              width={1200}
              height={900}
              sizes="95vw"
              unoptimized={selectedPhoto.source === "drive"}
            />
            <figcaption>
              <strong>{selectedPhoto.caption}</strong>
              <span>{selectedPhoto.credit}</span>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
