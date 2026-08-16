export function lowercaseHex(arrayBuffer) {
  let result = "";
  for (const value of new Uint8Array(arrayBuffer)) {
    result += value.toString(16).padStart(2, "0");
  }
  return result;
}

export async function sha256(bytes) {
  return lowercaseHex(await crypto.subtle.digest("SHA-256", bytes));
}
