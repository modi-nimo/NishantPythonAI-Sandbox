"use client";

/* eslint-disable @next/next/no-img-element */
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
              <img
                src={photo.src}
                alt={photo.alt}
                loading={index < 2 ? "eager" : "lazy"}
                decoding="async"
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
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
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
