"use client";

import { useState } from "react";
import type { GalleryPhoto, PhotoResult } from "../server/photos";
import { PhotoGallery } from "./PhotoGallery";

type PhotoWallWithMoreProps = {
  initialNextPageToken?: string;
  initialPhotos: GalleryPhoto[];
};

export function PhotoWallWithMore({
  initialNextPageToken,
  initialPhotos,
}: PhotoWallWithMoreProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [nextPageToken, setNextPageToken] = useState(initialNextPageToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMorePhotos() {
    if (!nextPageToken || isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        pageSize: "100",
        pageToken: nextPageToken,
      });
      const response = await fetch(`/api/photos?${params.toString()}`);

      if (!response.ok) {
        throw new Error("More photos could not be loaded.");
      }

      const result = (await response.json()) as PhotoResult;
      setPhotos((currentPhotos) => [...currentPhotos, ...result.photos]);
      setNextPageToken(result.nextPageToken);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "More photos could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <PhotoGallery photos={photos} variant="tiles" />

      {error ? <p className="load-more-error">{error}</p> : null}

      {nextPageToken ? (
        <div className="wall-more-action">
          <button
            className="button button-secondary"
            type="button"
            onClick={loadMorePhotos}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "See More"}
          </button>
        </div>
      ) : null}
    </>
  );
}
