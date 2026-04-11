import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br",
  "strong", "b",
  "em", "i",
  "a",
  "blockquote",
  "code", "pre",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "hr",
  "s",
  "u"
];

const ALLOWED_ATTR = ["href", "target", "rel"];

const ALLOWED_URI_REGEXP = /^(?:https?|mailto):/i;

export const sanitizeShowNotesHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    ALLOW_DATA_ATTR: false
  });
};
