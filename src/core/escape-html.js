const TEXT_REPLACEMENTS = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

const ATTRIBUTE_REPLACEMENTS = {
  ...TEXT_REPLACEMENTS,
  '"': "&quot;",
};

export function escapeHtmlText(value) {
  return value.replace(/[&<>]/gu, (character) => TEXT_REPLACEMENTS[character]);
}

export function escapeHtmlAttribute(value) {
  return value.replace(/[&<>"]/gu, (character) =>
    ATTRIBUTE_REPLACEMENTS[character]
  );
}
