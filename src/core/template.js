export function substituteAssociation(template, first, second) {
  return template.replace(/\{participant1\}|\{participant2\}/gu, (token) =>
    token === "{participant1}" ? first : second,
  );
}

export function substituteRelationshipTitle(template, relationshipTitle) {
  return template.replace(/\{relationshipTitle\}/gu, () => relationshipTitle);
}
