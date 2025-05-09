import type { NextApiRequest, NextApiResponse } from 'next';
import { unfurl } from 'unfurl.js';

import logger from '@/lib/logger';
import { getCloudinaryFetchUrl } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';

type UnfurlResult = Awaited<ReturnType<typeof unfurl>>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  if (!url || typeof url !== 'string') {
    logger.warn('URL is required and must be a string');
    return res
      .status(400)
      .json({ error: 'URL is required and must be a string.' });
  }

  try {
    logger.debug(`Unfurling URL: ${url}`);
    const metadata = await Promise.race<UnfurlResult>([
      unfurl(url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000),
      ),
    ]);

    if (!metadata.open_graph?.images?.[0]?.url) {
      logger.warn(`No OG image found for URL: ${url}`);
      return res.status(200).json({ result: 'error' });
    }

    if (metadata.open_graph?.images?.[0]?.url) {
      metadata.open_graph.images[0].url =
        getCloudinaryFetchUrl(metadata.open_graph.images[0].url) ||
        metadata.open_graph.images[0].url;
    }

    logger.info(`Successfully unfurled URL: ${url}`);
    return res.status(200).json({ result: metadata.open_graph });
  } catch (error: any) {
    logger.warn(`Error unfurling URL: ${url}`, safeStringify(error));
    return res.status(200).json({ result: 'error' });
  }
}
