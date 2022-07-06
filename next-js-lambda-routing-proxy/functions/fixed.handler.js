const hasExtension = /(.+)\.[a-zA-Z0-9]{2,5}$/;
const hasSlash = /\/$/;

exports.handler = (event, _, callback) => {
  const { request } = event.Records[0].cf;
  const uri = request.uri;

  if (uri && !uri.match(hasExtension) && !uri.match(hasSlash)) {
    request.uri = `${uri}.html`;
  }
  return callback(null, request);
};
