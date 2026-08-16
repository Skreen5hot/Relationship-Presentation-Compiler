const retained = [];
while (true) {
  retained.push(
    Array.from({ length: 100_000 }, (_, index) => ({
      index,
      payload: `retained-${index}`,
    })),
  );
}
