import axios from "axios";

class ShiprocketService {
  private token: string | null = null;

  async authenticate() {
    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    this.token = res.data.token;
    return this.token;
  }

  private async getHeaders() {
    if (!this.token) await this.authenticate();
    return { Authorization: `Bearer ${this.token}` };
  }

  async createCheckout(payload: any) {
    const headers = await this.getHeaders();
    return axios.post(
      "https://apiv2.shiprocket.in/v1/external/checkout/create",
      payload,
      { headers }
    );
  }

  async createShipment(payload: any) {
    const headers = await this.getHeaders();
    return axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      payload,
      { headers }
    );
  }
}

export default new ShiprocketService();