import { Transform } from 'class-transformer';

/**
 * Transform decorator to automatically sanitize SVG strings
 * Converts double quotes to single quotes in SVG attributes to avoid JSON parsing issues
 * when pasting SVG directly into Swagger UI
 */
export function SanitizeSvg() {
  return Transform(({ value }) => {
    if (typeof value === 'string' && value.trim().startsWith('<svg')) {
      // Replace double quotes with single quotes in XML/HTML attributes
      // This regex matches: attribute="value" and replaces with attribute='value'
      // Handles attributes with hyphens (e.g., stroke-width, view-box)
      return value.replace(/([\w-]+)=(")([^"]+)(")/g, "$1='$3'");
    }
    return value;
  });
}


