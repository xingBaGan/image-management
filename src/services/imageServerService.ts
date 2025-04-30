import axios from 'axios';

const IMAGE_SERVER_BASE_URL = 'http://127.0.0.1:8564';

interface StartImageServerResponse {
  tunnelUrl: string;
  message: string;
}

/**
 * Start the image server tunnel
 * @returns Promise with tunnel URL and message
 */
export const startImageServer = async (): Promise<StartImageServerResponse> => {
  try {
    const response = await axios.post<StartImageServerResponse>(
      `${IMAGE_SERVER_BASE_URL}/startTunnel`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to start image server: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Stop the image server tunnel
 * @returns Promise with the response data
 */
export const stopImageServer = async (): Promise<any> => {
  try {
    const response = await axios.post(`${IMAGE_SERVER_BASE_URL}/stopTunnel`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to stop image server: ${error.message}`);
    }
    throw error;
  }
}; 