export const SHOW_PLACEHOLDERS = false;

export type HeroImageStyle = "framed" | "bleed" | "arch";
export const HERO_IMAGE_STYLE: HeroImageStyle = "framed";
export const HERO_IMAGE_CAPTION = "";
export const HOME_BG_POSITION = "center center";
export const HOME_BG_DIM = 0.16;
export const HOME_BG_ROTATE_SECONDS = 14;

export const HOME_BG_IMAGES = Object.values(
  import.meta.glob<string>("/src/assets/home/bg-*.{jpg,jpeg,png,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
).sort();
