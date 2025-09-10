// FIX: Use Firebase v8 namespaced API for Firestore.
import { Job, JobWithSiteInfo } from '../types';
import { db } from '../firebaseConfig';
import { siteService } from './siteService';

// FIX: Use v8 namespaced API.
const jobsCollectionRef = db.collection('jobs');

// Helper to get today's date as a YYYY-MM-DD string
const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const jobService = {
  getUpcomingJobsForUser: async (userId: string): Promise<JobWithSiteInfo[]> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      const todayString = getTodayDateString();

      // Query only by user ID to avoid needing a composite index.
      // FIX: Use v8 namespaced query API.
      const q = jobsCollectionRef
        .where("assignedUserId", "==", userId);
      
      const querySnapshot = await q.get();
      const userJobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));

      // All filtering is now done on the client side to avoid complex queries that require a composite index.
      const filteredJobs = userJobs.filter(job => {
        // Exclude jobs that are already completed
        if (job.status === 'Completed') {
          return false;
        }
        // Exclude jobs that have already ended
        if (job.endDate < todayString) {
          return false;
        }
        // Include only jobs that start within the next 7 days
        const jobStartDate = new Date(job.startDate + 'T00:00:00');
        return jobStartDate <= sevenDaysFromNow;
      });

      const jobsWithSiteInfo: JobWithSiteInfo[] = [];
      for (const job of filteredJobs) {
        const site = await siteService.getSiteById(job.siteId);
        jobsWithSiteInfo.push({
          ...job,
          siteTitle: site?.title || 'Unknown Site',
          siteAddress: site?.address || 'N/A',
        });
      }

      jobsWithSiteInfo.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      return jobsWithSiteInfo;
    } catch (error) {
      console.error("Error fetching upcoming jobs:", error);
      throw new Error("Failed to fetch upcoming jobs.");
    }
  },
  
  getJobsBySiteId: async (siteId: string): Promise<Job[]> => {
    try {
      // FIX: Use v8 namespaced query API.
      const q = jobsCollectionRef.where("siteId", "==", siteId).orderBy("startDate", "desc");
      const querySnapshot = await q.get();
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    } catch (error) {
      console.error("Error fetching jobs for site:", error);
      throw new Error("Failed to fetch jobs for site.");
    }
  },

  getAllJobsForAdmin: async (): Promise<Job[]> => {
    try {
      // FIX: Use v8 namespaced API.
      const querySnapshot = await jobsCollectionRef.get();
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    } catch (error) {
      console.error("Error fetching all jobs:", error);
      throw new Error("Failed to fetch all jobs.");
    }
  },

  getJobById: async (jobId: string): Promise<Job | undefined> => {
    try {
      // FIX: Use v8 namespaced API.
      const jobDocRef = db.collection('jobs').doc(jobId);
      const docSnap = await jobDocRef.get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as Job;
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching job by ID:", error);
      throw new Error("Failed to fetch job data.");
    }
  },

  createJob: async (jobData: Omit<Job, 'id' | 'status'>): Promise<Job> => {
    try {
      const jobPayload = { ...jobData, status: 'Pending' as const };
      // FIX: Use v8 namespaced API.
      const docRef = await jobsCollectionRef.add(jobPayload);
      return { id: docRef.id, ...jobPayload };
    } catch (error) {
      console.error("Error creating job:", error);
      throw new Error("Failed to create job.");
    }
  },

  updateJob: async (jobId: string, jobUpdateData: Partial<Omit<Job, 'id'>>): Promise<Job> => {
    try {
      // FIX: Use v8 namespaced API.
      const jobDocRef = db.collection('jobs').doc(jobId);
      await jobDocRef.update(jobUpdateData);
      const updatedDoc = await jobDocRef.get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as Job;
    } catch (error) {
      console.error("Error updating job:", error);
      throw new Error("Failed to update job.");
    }
  },
  
  deleteJob: async (jobId: string): Promise<void> => {
    try {
      // FIX: Use v8 namespaced API.
      const jobDocRef = db.collection('jobs').doc(jobId);
      await jobDocRef.delete();
    } catch (error) {
      console.error("Error deleting job:", error);
      throw new Error("Failed to delete job.");
    }
  },

  updateJobStatus: async (jobId: string, status: Job['status']): Promise<Job> => {
    return await jobService.updateJob(jobId, { status });
  }
};