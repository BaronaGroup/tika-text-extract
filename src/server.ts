import {exec} from 'child_process';
import {TextExtractionConfig} from './server.types';

const debug = require('debug')('tika-text-extract');

/**
 * Starts a Tika Server on a default localhost:9998
 * @param artifactPath Full path to .jar file of Tika Server
 * @param options Customize text extraction
 * @return Resolves when server is started
 */

let child: ReturnType<typeof exec> | null = null;

export function startServer(artifactPath: string, options?: TextExtractionConfig): Promise<void> {
  if (!artifactPath) {
    throw new Error('Please provide path to Tika Server Artifact');
  }

  if (child) {
    throw new Error('Server already started');
  }

  const startCommand = `${getExecutableJavaPath(options)} ${getOptionsBasedOnJavaVersion(
    options
  )} -Duser.home=/tmp -jar ${artifactPath}`;

  return new Promise((resolve, reject) => {
    child = exec(startCommand);
    child.stderr.on('data', data => {
      debug(data);

      const isTika1_14Started: boolean = data.indexOf('INFO: Started') > -1;
      const isTika1_17Started: boolean = data.indexOf('Started Apache Tika server ') > -1;
      const isStarted: boolean = isTika1_14Started || isTika1_17Started;
      const isError: boolean = data.match(/java.*Exception|error/i);

      if (isStarted) {
        resolve();
      }

      if (isError) {
        reject(new Error(data));
      }
    });

    child.on('exit', () => {
      child = null;
    });
  });
}

function getExecutableJavaPath(options: TextExtractionConfig): string {
  if (options && options.executableJavaPath) {
    return options.executableJavaPath;
  }

  return 'java';
}

function getOptionsBasedOnJavaVersion(options: TextExtractionConfig): string {
  if (options && options.alignWithJava8) {
    return '';
  }

  return '--add-modules=java.xml.bind,java.activation';
}

export async function stopServer() {
  if (!child) {
    throw new Error('Server not running');
  }
  child.kill();
  while (child) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
