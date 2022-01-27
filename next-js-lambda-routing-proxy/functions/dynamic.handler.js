const hasExtension = /(.+)\.[a-zA-Z0-9]{2,5}$/;
const hasSlash = /\/$/;

export async function handler(event, _, callback) {
  const { request } = event.Records[0].cf;
  const uri = request.uri;
  const isBlogPost = uri.indexOf("/blog/post/");

  if (uri && !uri.test(hasSlash) && !uri.test(hasExtension) && isBlogPost) {
    request.uri = "/blog/post/[slug].html";
  }

  return callback(null, request);
}
