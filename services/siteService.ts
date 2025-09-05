import { Site } from '../types';

const MOCK_SITES_STORAGE_KEY = 'rlAllSites_no_map'; // Updated key

const initialMockSites: Site[] = [];

const getStoredSites = (): Site[] => {
  const storedSites = localStorage.getItem(MOCK_SITES_STORAGE_KEY);
  if (storedSites) {
    try {
      return JSON.parse(storedSites);
    } catch (e) {
      console.error("Error parsing sites from localStorage", e);
    }
  }
  localStorage.setItem(MOCK_SITES_STORAGE_KEY, JSON.stringify(initialMockSites));
  return initialMockSites;
};

const saveSites = (sites: Site[]): void => {
  localStorage.setItem(MOCK_SITES_STORAGE_KEY, JSON.stringify(sites));
};

export const siteService = {
  getAllSites: async (): Promise<Site[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getStoredSites());
      }, 200);
    });
  },

  getSiteById: async (siteId: string): Promise<Site | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sites = getStoredSites();
        resolve(sites.find(s => s.id === siteId));
      }, 100);
    });
  },

  createSite: async (siteData: Omit<Site, 'id'>): Promise<Site> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sites = getStoredSites();
        // Ensure latitude and longitude are not part of siteData if they sneak in
        const { latitude, longitude, ...restOfSiteData } = siteData as any; 
        const newSite: Site = {
          ...(restOfSiteData as Omit<Site, 'id'>), // Cast after removing potential map props
          id: `site_${Date.now()}`,
        };
        const updatedSites = [...sites, newSite];
        saveSites(updatedSites);
        resolve(newSite);
      }, 300);
    });
  },

  updateSite: async (siteId: string, siteUpdateData: Partial<Omit<Site, 'id'>>): Promise<Site | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let sites = getStoredSites();
        const siteIndex = sites.findIndex(s => s.id === siteId);
        if (siteIndex > -1) {
          // Ensure latitude and longitude are not part of updateData
          const { latitude, longitude, ...restOfUpdateData } = siteUpdateData as any;
          sites[siteIndex] = { ...sites[siteIndex], ...(restOfUpdateData as Partial<Omit<Site, 'id'>>) };
          saveSites(sites);
          resolve(sites[siteIndex]);
        } else {
          resolve(undefined);
        }
      }, 300);
    });
  },

  deleteSite: async (siteId: string): Promise<void> => { 
    return new Promise((resolve) => {
        setTimeout(() => {
            let sites = getStoredSites();
            const updatedSites = sites.filter(s => s.id !== siteId);
            saveSites(updatedSites);
            resolve();
        }, 300);
    });
}

};