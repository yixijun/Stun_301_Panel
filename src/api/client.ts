import axios from 'axios';
import type { AppData, ShareLinkDisplay } from '../types';
import { DEFAULT_APP_DATA } from '../types';

const API_BASE_URL = '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreateShareResponse {
  success: boolean;
  shareLink: {
    id: string;
    url: string;
    expiresAt?: number;
    permanent: boolean;
  };
}

interface ListSharesResponse {
  success: boolean;
  shareLinks: ShareLinkDisplay[];
}

export const apiClient = {
  /**
   * Get all app data from the server
   */
  async getData(): Promise<AppData> {
    try {
      const response = await axiosInstance.get<ApiResponse<AppData>>('/data');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return { ...DEFAULT_APP_DATA };
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Return default data if API fails
      return { ...DEFAULT_APP_DATA };
    }
  },

  /**
   * Save all app data to the server
   */
  async saveData(data: AppData): Promise<void> {
    await axiosInstance.post('/data', data);
  },

  /**
   * Get a navigation item's link by appid (webhook API)
   */
  async getLink(key: string, appid: string): Promise<string> {
    const response = await axiosInstance.get<{ success: boolean; link: string }>('/link', {
      params: { key, appid }
    });
    return response.data.link;
  },

  /**
   * Update a navigation item's link by appid (webhook API)
   */
  async updateLink(key: string, appid: string, link: string): Promise<void> {
    await axiosInstance.post('/link', null, {
      params: { key, appid, link }
    });
  },

  /**
   * Create a share link
   */
  async createShareLink(appid: string, params?: string, expiresIn?: number): Promise<CreateShareResponse['shareLink']> {
    const response = await axiosInstance.post<CreateShareResponse>('/share', {
      appid,
      params,
      expiresIn
    });
    return response.data.shareLink;
  },

  /**
   * List all share links
   */
  async listShareLinks(): Promise<ShareLinkDisplay[]> {
    const response = await axiosInstance.get<ListSharesResponse>('/shares');
    return response.data.shareLinks;
  },

  /**
   * Delete a share link
   */
  async deleteShareLink(id: string): Promise<void> {
    await axiosInstance.delete(`/share/${id}`);
  }
};

export default apiClient;
