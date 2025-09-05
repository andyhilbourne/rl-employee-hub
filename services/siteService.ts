import { Site } from '../types';

const MOCK_SITES_STORAGE_KEY = 'rlAllSites_no_map'; // Updated key

const initialMockSites: Site[] = [
  {
    id: 'site001',
    siteNumber: 'P-101',
    title: 'Northwood Plaza Renovation',
    address: '123 Northwood Ave, Anytown, USA',
    description: 'Complete overhaul of the Northwood Plaza shopping center. Phase 1: Exterior and parking.',
    // latitude: 34.0522, // Removed
    // longitude: -118.2437, // Removed
  },
  {
    id: 'site002',
    siteNumber: 'C-205',
    title: 'Downtown Tower Construction',
    address: '456 Central Blvd, Metro City, USA',
    description: 'New 40-story mixed-use tower. Currently in foundation and structural phase.',
  },
  {
    id: 'site003',
    siteNumber: 'R-330',
    title: 'Residential Complex - Oak Hills',
    address: '789 Oak Hills Drive, Suburbia, USA',
    description: 'Development of 50 new single-family homes. Site grading and utility installation.',
    // latitude: 34.1000, // Removed
    // longitude: -118.3000, // Removed
  }
];

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