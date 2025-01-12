import got from 'got';
import intoStream from 'into-stream';
import isStream from 'is-stream';
import getStream from 'get-stream';
import {getPort} from './config';

/**
 * Extract text from a document
 * @param input File to extract text from
 * @return Extracted text
 */
export function extract(input: Buffer | string | Promise<string> = ''): Promise<string> {
  const URL = `http://localhost:${getPort()}/tika`;
  const fileStream = isStream(input) ? input : intoStream(input);
  const tikaStream = got.stream.put(URL, {
    headers: {Accept: 'text/plain'},
  });

  return getStream(fileStream.pipe(tikaStream));
}
