import crypto from 'crypto';
import config from '../config';

export function generateHmac(data: any): string {
  const dataString =
    typeof data === 'string' ? data : JSON.stringify(data);

  return crypto
    .createHmac('sha256', config.SHIPROCKET_SECRET_KEY)
    .update(dataString)
    .digest('base64');
}
