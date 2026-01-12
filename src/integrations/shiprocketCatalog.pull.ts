import axios from "axios";
import config from "../config";
import { generateHmac } from "../utils/generateHmac";

class ShiprocketCatalogPullService {
  async fetchCatalogFromShiprocket() {
    const timestamp = new Date().toISOString();

    const payload = { timestamp };
    const hmac = generateHmac(payload);

    const response = await axios.post(
      'https://checkout-api.shiprocket.com/api/v1/custom/catalog',
      payload,
      {
        headers: {
          'X-Api-Key': config.SHIPROCKET_API_KEY,
          'X-Api-HMAC-SHA256': hmac,
        },
      }
    );

    return response.data.products;
  }
}

export default new ShiprocketCatalogPullService();