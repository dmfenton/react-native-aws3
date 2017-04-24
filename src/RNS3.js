/**
 * RNS3
 */

const AWS_DEFAULT_S3_HOST = 's3.amazonaws.com'
import { Request } from './Request';
import { S3Policy } from './S3Policy';
import { Metadata } from './Metadata';

const EXPECTED_RESPONSE_KEY_VALUE_RE = {
  key: /<Key>(.*)<\/Key>/,
  etag: /<ETag>"?([^"]*)"?<\/ETag>/,
  bucket: /<Bucket>(.*)<\/Bucket>/,
  location: /<Location>(.*)<\/Location>/,
};

function entries (o) {
  return Object.keys(o).map(k => [k, o[k]]);
}

function extractResponseValues (responseText) {
  return entries(EXPECTED_RESPONSE_KEY_VALUE_RE).reduce((result, [key, regex]) => {
    const match = responseText.match(regex)
    return { ...result, [key]: match && match[1] }
  }, {});
}

function setBodyAsParsedXML (response) {
  return {
    ...response,
    body: {
      postResponse: response.text == null ? null : extractResponseValues(response.text)
    }
  }
}

export class RNS3 {
  static put(file, upload) {
    const options = {
      ...upload,
      key: (upload.keyPrefix || '') + file.name,
      date: new Date,
      contentType: file.type
    };

    if (upload.metadata) options.metadata = Metadata.generate(upload);

    const url = `https://${options.bucket}.${options.awsUrl || AWS_DEFAULT_S3_HOST}`;
    const method = 'POST';
    const policy = S3Policy.generate(options);

    const request = Request.create(url, method, policy);

    if (options.metadata) {
      Object.keys(options.metadata).forEach((k) => request.set(k, options.metadata[k]));
    }

    return request
      .set('file', file)
      .send()
      .then(setBodyAsParsedXML);
  }
}
