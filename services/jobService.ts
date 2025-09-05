

import { Job, User, Site, JobWithSiteInfo } from '../types';
import { userService } from './userService'; // For fetching users to assign
import { siteService } from './siteService'; // For fetching site details

const MOCK_JOBS_STORAGE_KEY = 'rlAllJobs_v2_no_map'; // New key for new structure

const initialMockJobs: Job[] = [];

const getStoredJobs = (): Job[] => {
  const storedJobs = localStorage.getItem(MOCK_JOBS_STORAGE_KEY);
  if (storedJobs) {
    try {
      return JSON.parse(storedJobs);
    } catch (e) {
      console.error("Error parsing jobs from localStorage", e);
    }
  }
  localStorage.setItem(MOCK_JOBS_STORAGE_KEY, JSON.stringify(initialMockJobs));
  return initialMockJobs;
};

const saveJobs = (jobs: Job[]): void => {
  localStorage.setItem(MOCK_JOBS_STORAGE_KEY, JSON.stringify(jobs));
};


export const jobService = {
  getUpcomingJobsForUser: async (userId: string): Promise<JobWithSiteInfo[]> => {
    return new Promise(async (resolve) => {
      const allJobs = getStoredJobs();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      sevenDaysFromNow.setHours(23, 59, 59, 999);
      
      const userJobsForNext7Days = allJobs.filter(job => {
        const jobStartDate = new Date(job.startDate + 'T00:00:00');
        const jobEndDate = new Date(job.endDate + 'T23:59:59');

        return job.assignedUserId === userId &&
               job.status !== 'Completed' && // Exclude completed jobs from the schedule view
               jobStartDate <= sevenDaysFromNow &&
               jobEndDate >= today;
      });

      // Enrich jobs with site information
      const jobsWithSiteInfo: JobWithSiteInfo[] = [];
      for (const job of userJobsForNext7Days) {
        const site = await siteService.getSiteById(job.siteId);
        if (site) {
          jobsWithSiteInfo.push({
            ...job,
            siteTitle: site.title,
            siteAddress: site.address,
          });
        } else {
          // Handle case where site isn't found, though ideally it always should be
          jobsWithSiteInfo.push({
            ...job,
            siteTitle: 'Unknown Site',
            siteAddress: 'N/A',
          });
        }
      }
      
      // Sort jobs by start date
      jobsWithSiteInfo.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      resolve(jobsWithSiteInfo);
    });
  },
  
  getJobsBySiteId: async (siteId: string): Promise<Job[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allJobs = getStoredJobs();
        resolve(allJobs.filter(job => job.siteId === siteId).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
      }, 150);
    });
  },

  getAllJobsForAdmin: async (): Promise<Job[]> => { 
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getStoredJobs());
      }, 300);
    });
  },

  getJobById: async (jobId: string): Promise<Job | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allJobs = getStoredJobs();
        resolve(allJobs.find(job => job.id === jobId));
      }, 100);
    });
  },

  createJob: async (jobData: Omit<Job, 'id' | 'status'>): Promise<Job> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allJobs = getStoredJobs();
        const newJob: Job = {
          ...jobData,
          id: `job_${Date.now()}`,
          status: 'Pending', 
        };
        const updatedJobs = [...allJobs, newJob];
        saveJobs(updatedJobs);
        resolve(newJob);
      }, 300);
    });
  },

  updateJob: async (jobId: string, jobUpdateData: Partial<Omit<Job, 'id' | 'status' | 'siteId'>>): Promise<Job | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let allJobs = getStoredJobs();
            const jobIndex = allJobs.findIndex(j => j.id === jobId);
            if (jobIndex > -1) {
                allJobs[jobIndex] = { 
                    ...allJobs[jobIndex], 
                    ...jobUpdateData,
                };
                saveJobs(allJobs);
                resolve(allJobs[jobIndex]);
            } else {
                resolve(undefined);
            }
        }, 300);
    });
  },
  
  deleteJob: async (jobId: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let jobs = getStoredJobs();
            const updatedJobs = jobs.filter(j => j.id !== jobId);
            saveJobs(updatedJobs);
            resolve();
        }, 300);
    });
  },

  updateJobStatus: async (jobId: string, status: Job['status']): Promise<Job | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let allJobs = getStoredJobs();
        const jobIndex = allJobs.findIndex(j => j.id === jobId);
        if (jobIndex > -1) {
          allJobs[jobIndex].status = status;
          saveJobs(allJobs);
          resolve(allJobs[jobIndex]);
        } else {
          resolve(undefined);
        }
      }, 200);
    });
  }
};