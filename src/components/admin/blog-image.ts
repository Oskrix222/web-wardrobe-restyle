import ImageExtension from "@tiptap/extension-image";

export const IMAGE_SIZES = [
  { value: "small", label: "33%" },
  { value: "medium", label: "50%" },
  { value: "large", label: "75%" },
  { value: "full", label: "100%" },
] as const;

export const IMAGE_ALIGNS = ["left", "center", "right"] as const;

export type ImageSize = (typeof IMAGE_SIZES)[number]["value"];
export type ImageAlign = (typeof IMAGE_ALIGNS)[number];

/**
 * Image node with a preset width and alignment, stored as data-size /
 * data-align on the <img>. Widths are percentages and the CSS turns every
 * image full-width on phones, so posts stay responsive without any extra work.
 */
export const BlogImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: "full" satisfies ImageSize,
        parseHTML: (el) => el.getAttribute("data-size") ?? "full",
        renderHTML: (attrs) => ({ "data-size": attrs["size"] }),
      },
      align: {
        default: "center" satisfies ImageAlign,
        parseHTML: (el) => el.getAttribute("data-align") ?? "center",
        renderHTML: (attrs) => ({ "data-align": attrs["align"] }),
      },
    };
  },
});
