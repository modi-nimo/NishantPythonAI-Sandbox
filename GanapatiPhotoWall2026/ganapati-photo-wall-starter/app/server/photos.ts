export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  credit: string;
  aspect: "portrait" | "landscape" | "square" | "tall";
  source: "sample" | "drive";
};

export type PhotoResult = {
  photos: GalleryPhoto[];
  status: "sample" | "connected" | "empty" | "error";
  message: string;
};

export const samplePhotos: GalleryPhoto[] = [
  {
    id: "sample-1",
    src: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=85",
    alt: "A warmly lit Indian temple courtyard",
    caption: "Blessings at the mandap",
    credit: "Festival inspiration",
    aspect: "portrait",
    source: "sample",
  },
  {
    id: "sample-2",
    src: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=900&q=85",
    alt: "Decorative lights glowing during an evening celebration",
    caption: "Evening aarti glow",
    credit: "Festival inspiration",
    aspect: "landscape",
    source: "sample",
  },
  {
    id: "sample-3",
    src: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85",
    alt: "A plate of festive Indian sweets",
    caption: "Prasad and sweet smiles",
    credit: "Festival inspiration",
    aspect: "square",
    source: "sample",
  },
  {
    id: "sample-4",
    src: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=900&q=85",
    alt: "Marigold flowers used for festival decoration",
    caption: "Marigold mornings",
    credit: "Festival inspiration",
    aspect: "tall",
    source: "sample",
  },
  {
    id: "sample-5",
    src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85",
    alt: "A decorated celebration hall with warm lights",
    caption: "Community celebration",
    credit: "Festival inspiration",
    aspect: "landscape",
    source: "sample",
  },
  {
    id: "sample-6",
    src: "https://images.unsplash.com/photo-1605369189042-08bc9708c106?auto=format&fit=crop&w=900&q=85",
    alt: "Hands holding a lit diya lamp",
    caption: "Light, devotion, togetherness",
    credit: "Festival inspiration",
    aspect: "portrait",
    source: "sample",
  },
  {
    id: "sample-7",
    src: "https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=900&q=85",
    alt: "Colorful festive powder and flowers",
    caption: "Colors of the festival",
    credit: "Festival inspiration",
    aspect: "square",
    source: "sample",
  },
  {
    id: "sample-8",
    src: "https://images.unsplash.com/photo-1606293926249-ed957a41c00e?auto=format&fit=crop&w=900&q=85",
    alt: "Warm festival lights hanging outdoors",
    caption: "The lane outside the pandal",
    credit: "Festival inspiration",
    aspect: "tall",
    source: "sample",
  },
];

export function getFallbackPhotos(): PhotoResult {
  return {
    photos: samplePhotos,
    status: "sample",
    message:
      "A few festive moments are shown here while Sensorium's celebration wall gets ready.",
  };
}
