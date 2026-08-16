import { acquirePublicationLock, validateOutputTarget } from "../../src/host-node/publication.js";

const [outputPath] = process.argv.slice(2);
const preparedOutput = await validateOutputTarget({ outputPath });
const releasePublicationLock = await acquirePublicationLock(preparedOutput);
void releasePublicationLock;
process.send?.({ acquired: true });
setInterval(() => {}, 60_000);
