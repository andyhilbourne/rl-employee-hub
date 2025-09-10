// FIX: Use Firebase v8 namespaced API for Firestore.
import { Site } from '../types';
import { db } from '../firebaseConfig';

// FIX: Use v8 namespaced API.
const sitesCollectionRef = db.collection('sites');

export const siteService = {
  getAllSites: async (): Promise<Site[]> => {
    try {
      // FIX: Use v8 namespaced API.
      const querySnapshot = await sitesCollectionRef.get();
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
    } catch (error) {
      console.error("Error fetching all sites:", error);
      throw new Error("Failed to fetch sites.");
    }
  },

  getSiteById: async (siteId: string): Promise<Site | undefined> => {
    try {
      // FIX: Use v8 namespaced API.
      const siteDocRef = db.collection('sites').doc(siteId);
      const docSnap = await siteDocRef.get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as Site;
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching site by ID:", error);
      throw new Error("Failed to fetch site data.");
    }
  },

  createSite: async (siteData: Omit<Site, 'id'>): Promise<Site> => {
    try {
      // FIX: Use v8 namespaced API.
      const docRef = await sitesCollectionRef.add(siteData);
      return { id: docRef.id, ...siteData };
    } catch (error) {
      console.error("Error creating site:", error);
      throw new Error("Failed to create new site.");
    }
  },

  updateSite: async (siteId: string, siteUpdateData: Partial<Omit<Site, 'id'>>): Promise<Site> => {
    try {
      // FIX: Use v8 namespaced API.
      const siteDocRef = db.collection('sites').doc(siteId);
      await siteDocRef.update(siteUpdateData);
      const updatedDoc = await siteDocRef.get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as Site;
    } catch (error) {
      console.error("Error updating site:", error);
      throw new Error("Failed to update site.");
    }
  },

  deleteSite: async (siteId: string): Promise<void> => {
    try {
      // FIX: Use v8 namespaced API.
      const siteDocRef = db.collection('sites').doc(siteId);
      await siteDocRef.delete();
    } catch (error) {
      console.error("Error deleting site:", error);
      throw new Error("Failed to delete site.");
    }
  }
};