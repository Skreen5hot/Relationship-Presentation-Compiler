export const contextDocument = {
  "@context": {
    name: "https://schema.org/name",
    rp: "https://example.org/relationship-presentation-poc/ontology/"
  }
};

export const document = {
  "@context":
    "https://example.org/relationship-presentation-poc/context/poc.jsonld",
  "@id": "https://example.org/relationship-presentation-poc/fixture/association-1",
  "@type": "rp:PersonAssociation",
  name: "Alice and Bob"
};

export const expectedExpanded = [
  {
    "@id": "https://example.org/relationship-presentation-poc/fixture/association-1",
    "@type": [
      "https://example.org/relationship-presentation-poc/ontology/PersonAssociation"
    ],
    "https://schema.org/name": [
      {
        "@value": "Alice and Bob"
      }
    ]
  }
];
