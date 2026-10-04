export const SHOW_PLACEHOLDERS = true;

export const HOME_BG_IMAGES = Object.values(
  import.meta.glob<string>("/src/assets/home/bg-*.{jpg,jpeg,png,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
).sort();
