/**
 * @this {Pjax}
 * @param {Response} response
 * @return {Promise<Document>}
 */
export default async function parseResponse(response) {
  // Parse document first to ensure changing status with valid document.
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');

  // Parse URL. The response URL does not contain the hash.
  const newURL = new URL(response.url);
  newURL.hash = new URL(this.status.request.url).hash;

  // Update Pjax status.
  this.status.location = newURL;
  this.status.response = response;

  return doc;
}
