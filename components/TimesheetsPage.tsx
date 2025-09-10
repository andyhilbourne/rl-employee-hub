

import React, { useState, useEffect, useCallback } from 'react';
import { User, TimeEntry, Job, Site } from '../types';
import { timeService } from '../services/timeService';
import { jobService } from '../services/jobService';
import { siteService } from '../services/siteService';
import { userService } from '../services/userService';
import { LoadingSpinner } from './LoadingSpinner';
import { ListBulletIcon, DownloadIcon, TrashIcon } from './icons';
import { Button } from './Button';

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return 'N/A';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const toDateInputFormat = (date: Date): string => date.toISOString().split('T')[0];
const toTimeInputFormat = (date: Date): string => date.toTimeString().slice(0, 5);

// Helper function to get the Monday of a given date's week
const getWeekStartDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // Sunday - 0, Monday - 1, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Helper function to get the Sunday of a given date's week
const getWeekEndDate = (startDate: Date): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
};


interface SiteAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllocate: (siteId: string) => void;
  sites: Site[];
  isAllocating: boolean;
}

const SiteAllocationModal: React.FC<SiteAllocationModalProps> = ({ isOpen, onClose, onAllocate, sites, isAllocating }) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  useEffect(() => {
    if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  if (!isOpen) return null;

  const handleAllocateClick = () => {
    if (selectedSiteId) {
      onAllocate(selectedSiteId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Allocate Time to Site</h3>
        <p className="text-sm text-gray-600 mb-4">Select a site to associate with this unassigned time entry.</p>
        <div>
          <label htmlFor="site-select" className="block text-sm font-medium text-gray-700">Site</label>
          <select
            id="site-select"
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
            disabled={isAllocating || sites.length === 0}
          >
            {sites.length > 0 ? (
                sites.map(site => (
                    <option key={site.id} value={site.id}>{site.title} ({site.siteNumber})</option>
                ))
            ) : (
                <option>No sites available</option>
            )}
          </select>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button onClick={onClose} variant="secondary" disabled={isAllocating}>Cancel</Button>
          <Button onClick={handleAllocateClick} isLoading={isAllocating} disabled={!selectedSiteId}>Allocate</Button>
        </div>
      </div>
    </div>
  );
};


interface TimeEntryRowProps {
  entry: TimeEntry;
  isEditing: boolean;
  onSave: (entryId: string, updates: Partial<TimeEntry>) => Promise<void>;
  onCancel: () => void;
  onEdit: (entryId: string) => void;
  onDelete: (entryId: string) => Promise<void>;
  jobMap: Record<string, Job>;
  siteMap: Record<string, Site>;
  onAllocate: (entryId: string) => void;
}

const TimeEntryRow: React.FC<TimeEntryRowProps> = ({ entry, isEditing, onSave, onCancel, onEdit, onDelete, jobMap, siteMap, onAllocate }) => {
  const [formData, setFormData] = useState({
    clockInDate: toDateInputFormat(entry.clockInTime),
    clockInTime: toTimeInputFormat(entry.clockInTime),
    clockOutDate: entry.clockOutTime ? toDateInputFormat(entry.clockOutTime) : '',
    clockOutTime: entry.clockOutTime ? toTimeInputFormat(entry.clockOutTime) : '',
    notes: entry.notes || '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Reset form data if the entry prop changes (e.g., after a save)
    setFormData({
      clockInDate: toDateInputFormat(entry.clockInTime),
      clockInTime: toTimeInputFormat(entry.clockInTime),
      clockOutDate: entry.clockOutTime ? toDateInputFormat(entry.clockOutTime) : '',
      clockOutTime: entry.clockOutTime ? toTimeInputFormat(entry.clockOutTime) : '',
      notes: entry.notes || '',
    });
  }, [entry]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsProcessing(true);
    const newClockInTime = new Date(`${formData.clockInDate}T${formData.clockInTime}`);
    const newClockOutTime = formData.clockOutDate && formData.clockOutTime
      ? new Date(`${formData.clockOutDate}T${formData.clockOutTime}`)
      : undefined;

    await onSave(entry.id, {
      clockInTime: newClockInTime,
      clockOutTime: newClockOutTime,
      notes: formData.notes,
    });
    setIsProcessing(false);
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this time entry? This action cannot be undone.')) {
        setIsProcessing(true);
        await onDelete(entry.id);
        setIsProcessing(false);
    }
  };
  
  const associatedJob = entry.jobId ? jobMap[entry.jobId] : null;
  const associatedSite = entry.siteId ? siteMap[entry.siteId] : null;

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-2 py-3" colSpan={5}>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Clock In</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input type="date" name="clockInDate" value={formData.clockInDate} onChange={handleInputChange} className="input-field w-full" />
                  <input type="time" name="clockInTime" value={formData.clockInTime} onChange={handleInputChange} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Clock Out</label>
                 <div className="flex items-center space-x-2 mt-1">
                  <input type="date" name="clockOutDate" value={formData.clockOutDate} onChange={handleInputChange} className="input-field w-full" />
                  <input type="time" name="clockOutTime" value={formData.clockOutTime} onChange={handleInputChange} className="input-field w-full" />
                </div>
              </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Notes (Reason for change)</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} className="input-field w-full mt-1" placeholder="e.g., Forgot to clock out on Friday"></textarea>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <Button onClick={onCancel} variant="secondary" size="sm" disabled={isProcessing}>Cancel</Button>
              <Button onClick={handleSave} variant="primary" size="sm" isLoading={isProcessing}>Save Changes</Button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  let duration = entry.clockOutTime ? entry.clockOutTime.getTime() - entry.clockInTime.getTime() : 0;
  let breakDeducted = false;
  const sevenHoursInMillis = 7 * 60 * 60 * 1000;
  const thirtyMinutesInMillis = 30 * 60 * 1000;

  if (duration > sevenHoursInMillis) {
    duration -= thirtyMinutesInMillis;
    breakDeducted = true;
  }

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-gray-700">
        <div>{new Date(entry.clockInTime).toLocaleDateString()}</div>
        {associatedJob ? (
            <div className="text-xs text-blue-600 font-semibold mt-1">
                <i className="fas fa-briefcase mr-1"></i>
                {associatedJob.title}
            </div>
        ) : associatedSite ? (
            <div className="text-xs text-green-600 font-semibold mt-1">
                <i className="fas fa-map-marker-alt mr-1"></i>
                Allocated to: {associatedSite.title}
            </div>
        ) : (
             <div className="text-xs text-gray-500 italic mt-1">Unassigned</div>
        )}
        {entry.notes && <div className="text-xs text-gray-500 italic mt-1"><i className="fas fa-sticky-note mr-1"></i>{entry.notes}</div>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{new Date(entry.clockInTime).toLocaleTimeString()}</td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {entry.clockOutTime ? new Date(entry.clockOutTime).toLocaleTimeString() : <span className="text-yellow-600 italic">Still Clocked In</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
        {entry.clockOutTime ? (
            <div>
              {formatDuration(duration)}
              {breakDeducted && <div className="text-xs text-gray-500 italic mt-1">(30m break deducted)</div>}
            </div>
          ) : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-right space-x-2">
         {!entry.jobId && !entry.siteId && entry.clockOutTime && (
            <Button onClick={() => onAllocate(entry.id)} variant="primary" size="sm">Allocate</Button>
         )}
         <Button onClick={() => onEdit(entry.id)} variant="ghost" size="sm" disabled={!entry.clockOutTime}>Edit</Button>
         <Button onClick={handleDelete} variant="danger" size="sm" leftIcon={<TrashIcon className="w-4 h-4" />} isLoading={isProcessing}></Button>
      </td>
    </tr>
  );
};


interface TimesheetsPageProps {
  user: User;
}

interface WeeklyTimeEntries {
  weekIdentifier: string;
  weekStart: Date;
  weekEnd: Date;
  entries: TimeEntry[];
  totalHours: number;
}

export const TimesheetsPage: React.FC<TimesheetsPageProps> = ({ user }) => {
  const [activeWeeklyEntries, setActiveWeeklyEntries] = useState<WeeklyTimeEntries[]>([]);
  const [archivedWeeklyEntries, setArchivedWeeklyEntries] = useState<WeeklyTimeEntries[]>([]);
  const [viewMode, setViewMode] = useState<'active' | 'archive'>('active');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [jobMap, setJobMap] = useState<Record<string, Job>>({});
  const [siteMap, setSiteMap] = useState<Record<string, Site>>({});

  const [allocationEntryId, setAllocationEntryId] = useState<string | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);

  const [userWebhookUrl, setUserWebhookUrl] = useState<string | null>(null);
  const [submittingWeekId, setSubmittingWeekId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEditingEntryId(null);
    try {
      const [allEntries, allJobs, allSites, currentUserDetails] = await Promise.all([
        timeService.getTimesheetEntries(user.id),
        jobService.getAllJobsForAdmin(),
        siteService.getAllSites(),
        userService.getUserById(user.id),
      ]);
      
      setUserWebhookUrl(currentUserDetails?.webhookUrl || null);

      const newJobMap: Record<string, Job> = {};
      allJobs.forEach(job => { newJobMap[job.id] = job; });
      setJobMap(newJobMap);

      const newSiteMap: Record<string, Site> = {};
      allSites.forEach(site => { newSiteMap[site.id] = site; });
      setSiteMap(newSiteMap);
      
      const groupedByWeek: Record<string, { weekStart: Date; weekEnd: Date; entries: TimeEntry[]; }> = {};

      allEntries.forEach(entry => {
        const weekStart = getWeekStartDate(entry.clockInTime);
        const weekIdentifier = weekStart.toISOString().split('T')[0];

        if (!groupedByWeek[weekIdentifier]) {
          groupedByWeek[weekIdentifier] = {
            weekStart,
            weekEnd: getWeekEndDate(weekStart),
            entries: [],
          };
        }
        groupedByWeek[weekIdentifier].entries.push(entry);
      });
      
      const weeklyData: WeeklyTimeEntries[] = Object.values(groupedByWeek)
        .map(weekGroup => {
            weekGroup.entries.sort((a, b) => a.clockInTime.getTime() - b.clockInTime.getTime());
            
            let totalMillis = 0;
            const sevenHoursInMillis = 7 * 60 * 60 * 1000;
            const thirtyMinutesInMillis = 30 * 60 * 1000;
            weekGroup.entries.forEach(entry => {
                if (entry.clockOutTime) {
                    let duration = entry.clockOutTime.getTime() - entry.clockInTime.getTime();
                    if (duration > sevenHoursInMillis) {
                        duration -= thirtyMinutesInMillis;
                    }
                    totalMillis += duration;
                }
            });
            
            return {
                ...weekGroup,
                weekIdentifier: weekGroup.weekStart.toISOString().split('T')[0],
                totalHours: totalMillis / (1000 * 60 * 60),
            };
        })
        .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
      
      const submittedWeeks = currentUserDetails?.submittedWeeks || [];
      const active = weeklyData.filter(w => !submittedWeeks.includes(w.weekIdentifier));
      const archived = weeklyData.filter(w => submittedWeeks.includes(w.weekIdentifier));

      setActiveWeeklyEntries(active);
      setArchivedWeeklyEntries(archived);

    } catch (err) {
      setError('Failed to fetch timesheet entries.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (entryId: string, updates: Partial<TimeEntry>) => {
    setMessage(null);
    try {
        await timeService.updateTimesheetEntry(entryId, updates);
        setMessage({ type: 'success', text: 'Entry updated successfully.' });
        setEditingEntryId(null);
        await fetchData();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update entry.';
        setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleDelete = async (entryId: string) => {
    setMessage(null);
    try {
        await timeService.deleteTimesheetEntry(entryId);
        setMessage({ type: 'success', text: 'Entry deleted successfully.' });
        await fetchData();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry.';
        setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleOpenAllocationModal = (entryId: string) => {
    setAllocationEntryId(entryId);
  };
  
  const handleCloseAllocationModal = () => {
    setAllocationEntryId(null);
  };

  const handleAllocateSite = async (siteId: string) => {
    if (!allocationEntryId) return;
    setIsAllocating(true);
    setMessage(null);
    try {
      await timeService.updateTimesheetEntry(allocationEntryId, { siteId });
      setMessage({ type: 'success', text: 'Time entry allocated successfully.' });
      handleCloseAllocationModal();
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to allocate entry.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsAllocating(false);
    }
  };
  
  const escapeCsvCell = (cell: string | number | undefined): string => {
    if (cell === undefined || cell === null) return '';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const processWeekDataForExport = (weekData: WeeklyTimeEntries) => {
     const { entries: userEntries } = weekData;
     const dailyData = new Map<string, { entries: TimeEntry[], date: Date }>();
      userEntries.forEach(entry => {
          const dateStr = entry.clockInTime.toISOString().split('T')[0];
          if (!dailyData.has(dateStr)) {
              const entryDate = new Date(entry.clockInTime);
              entryDate.setHours(0,0,0,0);
              dailyData.set(dateStr, { entries: [], date: entryDate });
          }
          dailyData.get(dateStr)!.entries.push(entry);
      });

      const processedDays: { date: string, dayName: string, workingHours: string, sites: { siteName: string, hours: number }[], totalHours: number }[] = [];
      const siteTotals = new Map<string, number>();
      let grandTotalHours = 0;

      dailyData.forEach((dayInfo) => {
          const { entries } = dayInfo;
          if (entries.length === 0) return;
          entries.sort((a, b) => a.clockInTime.getTime() - b.clockInTime.getTime());
          
          const earliestClockIn = entries[0].clockInTime;
          const latestClockOut = entries.reduce((latest, entry) => 
              (entry.clockOutTime && entry.clockOutTime.getTime() > latest.getTime()) ? entry.clockOutTime : latest, 
              new Date(0)
          );

          if (latestClockOut.getTime() === 0) return;
          
          const workingHours = `${earliestClockIn.toTimeString().slice(0, 5)} till ${latestClockOut.toTimeString().slice(0, 5)}`;
          
          const siteDurations = new Map<string, number>();
          let totalDurationMillis = 0;

          entries.forEach(entry => {
              if (entry.clockOutTime) {
                  const duration = entry.clockOutTime.getTime() - entry.clockInTime.getTime();
                  totalDurationMillis += duration;
                  if (entry.jobId) {
                      const job = jobMap[entry.jobId];
                      if (job && job.siteId) {
                          siteDurations.set(job.siteId, (siteDurations.get(job.siteId) || 0) + duration);
                      }
                  } else if (entry.siteId) {
                      siteDurations.set(entry.siteId, (siteDurations.get(entry.siteId) || 0) + duration);
                  }
              }
          });

          let totalHoursWithBreaks = totalDurationMillis / (1000 * 60 * 60);
          if (totalHoursWithBreaks > 7) totalHoursWithBreaks -= 0.5;

          const daySites: { siteName: string, hours: number }[] = [];
          siteDurations.forEach((duration, siteId) => {
              const site = siteMap[siteId];
              if (site) {
                  const siteHours = totalDurationMillis > 0 ? (duration / totalDurationMillis) * totalHoursWithBreaks : 0;
                  daySites.push({ siteName: site.title, hours: siteHours });
                  siteTotals.set(site.title, (siteTotals.get(site.title) || 0) + siteHours);
              }
          });
          
          if (daySites.length === 0 && totalHoursWithBreaks > 0) {
              siteTotals.set('Unassigned', (siteTotals.get('Unassigned') || 0) + totalHoursWithBreaks);
          }

          grandTotalHours += totalHoursWithBreaks;
          processedDays.push({ 
            date: dayInfo.date.toLocaleDateString('en-GB'),
            dayName: dayInfo.date.toLocaleDateString('en-US', { weekday: 'long' }),
            workingHours, 
            sites: daySites, 
            totalHours: totalHoursWithBreaks 
          });
      });

      const siteTotalsObject: Record<string, number> = {};
      siteTotals.forEach((hours, name) => {
        siteTotalsObject[name] = parseFloat(hours.toFixed(2));
      });

      return { processedDays, siteTotals: siteTotalsObject, grandTotalHours: parseFloat(grandTotalHours.toFixed(2)) };
  };

  const handleExportWeekToCsv = (weekData: WeeklyTimeEntries) => {
    const { weekStart, weekEnd } = weekData;
    const { processedDays, siteTotals, grandTotalHours } = processWeekDataForExport(weekData);

    const csvRows = [[`Timesheet for ${user.name}`].join(','), []];
    const headers = ['Week', 'Day', 'Date', 'Working Hours', 'Site 1 Job No', 'Hours Less Break', 'Site 2 Job No', 'Hours Less Break', 'Site 3 Job No', 'Hours Less Break', 'Total Hours'];
    csvRows.push(headers.map(escapeCsvCell).join(','));

    csvRows.push([`Week 1`].join(','));
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStrGB = d.toLocaleDateString('en-GB');
        const dayData = processedDays.find(p => p.date === dateStrGB);

        let rowData;
        if (dayData) {
            const rowSites: string[] = [];
            for (let i = 0; i < 3; i++) {
                rowSites.push(dayData.sites[i] ? escapeCsvCell(dayData.sites[i].siteName) : '');
                rowSites.push(dayData.sites[i] ? escapeCsvCell(dayData.sites[i].hours.toFixed(2)) : '');
            }
            rowData = ['', dayName, d.toLocaleDateString('en-GB'), dayData.workingHours, ...rowSites, dayData.totalHours.toFixed(2)];
        } else {
            rowData = ['', dayName, d.toLocaleDateString('en-GB'), '', '', '', '', '', '', '', ''];
        }
        csvRows.push(rowData.map(escapeCsvCell).join(','));
    }
    
    csvRows.push(...['', '', ''].map(r => r.split(',').map(escapeCsvCell).join(',')));
    const sortedSites = Object.keys(siteTotals).sort();
    sortedSites.forEach((siteName) => {
        const hours = siteTotals[siteName] || 0;
        csvRows.push(['', escapeCsvCell(siteName), '', '', '', '', '', '', '', escapeCsvCell(hours.toFixed(2))].join(','));
    });
    csvRows.push(...['', ''].map(r => r.split(',').map(escapeCsvCell).join(',')));
    csvRows.push(['', '', '', '', '', '', '', '', 'Total Hours', escapeCsvCell(grandTotalHours.toFixed(2))].join(','));

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const userName = user.name.replace(/\s/g, '_');
    const startDateStr = weekStart.toISOString().split('T')[0];
    const endDateStr = weekEnd.toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Timesheet-${userName}-${startDateStr}_to_${endDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmitAndExportWeek = async (weekData: WeeklyTimeEntries) => {
    setSubmittingWeekId(weekData.weekIdentifier);
    setMessage(null);

    // If webhook is configured, send data there
    if (userWebhookUrl) {
      try {
        const { processedDays, siteTotals, grandTotalHours } = processWeekDataForExport(weekData);
        
        const minimalProcessedDays = processedDays.map(d => ({
            date: d.date,
            dayName: d.dayName,
            work: d.sites.map(w => ({
                siteName: w.siteName,
                hours: w.hours
            })),
            totalHours: d.totalHours
        }));

        const minimalSiteTotals = Object.fromEntries(Object.entries(siteTotals || {}));

        const minimalPayload = {
            employee: { id: user.id, name: user.name },
            week: {
                start: weekData.weekStart.toISOString().split('T')[0],
                end: weekData.weekEnd.toISOString().split('T')[0],
            },
            totalHours: grandTotalHours,
            dailyBreakdown: minimalProcessedDays,
            siteTotals: minimalSiteTotals
        };
        
        // Use 'no-cors' mode and 'text/plain' to avoid CORS issues with Google Apps Script
        await fetch(userWebhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(minimalPayload)
        });
        
        // With 'no-cors', we can't read the response. We assume success if fetch doesn't throw an error.
        setMessage({ type: 'success', text: 'Timesheet submitted! Please verify the data in your Google Sheet.' });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during submission.';
        setMessage({ type: 'error', text: `Submission Failed: ${errorMessage}` });
        setSubmittingWeekId(null);
        return; 
      }
    } else {
        // Fallback to CSV download
        handleExportWeekToCsv(weekData);
    }
    
    // Archive the week
    await userService.addSubmittedWeek(user.id, weekData.weekIdentifier);
    setActiveWeeklyEntries(prev => prev.filter(w => w.weekIdentifier !== weekData.weekIdentifier));
    setArchivedWeeklyEntries(prev => [...prev, weekData].sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()));

    if (!userWebhookUrl) {
      setMessage({ type: 'success', text: 'Timesheet downloaded and moved to archive.' });
    }
    setTimeout(() => setMessage(null), 5000);
    setSubmittingWeekId(null);
  };

  const listToRender = viewMode === 'active' ? activeWeeklyEntries : archivedWeeklyEntries;

  return (
    <div className="space-y-6">
      <div className="flex items-center text-gray-700 pb-2 border-b-2 border-purple-500">
        <ListBulletIcon className="w-8 h-8 mr-3 text-purple-600" />
        <h2 className="text-3xl font-bold">My Timesheets</h2>
      </div>

       <div className="mb-6 border-b border-gray-300">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                  onClick={() => setViewMode('active')}
                  className={`${
                      viewMode === 'active'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-t-md`}
              >
                  Active Timesheets
              </button>
              <button
                  onClick={() => setViewMode('archive')}
                  className={`${
                      viewMode === 'archive'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-t-md`}
              >
                  Archived
              </button>
          </nav>
      </div>

      <SiteAllocationModal
        isOpen={!!allocationEntryId}
        onClose={handleCloseAllocationModal}
        onAllocate={handleAllocateSite}
        sites={Object.values(siteMap)}
        isAllocating={isAllocating}
      />

      {message && (
        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>
      ) : error ? (
         <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
      ) : listToRender.length === 0 ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-7 5V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No {viewMode} timesheets found.</h3>
          <p className="mt-1 text-sm text-gray-500">
            {viewMode === 'active' ? 'Clock in to record your work hours.' : 'Submit an active timesheet to see it here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {listToRender.map(week => {
            const isArchive = viewMode === 'archive';
            const isSubmitting = submittingWeekId === week.weekIdentifier;
            let isOverdue = false;
            if (!isArchive) {
                const threeDaysAfterEnd = new Date(week.weekEnd);
                threeDaysAfterEnd.setDate(threeDaysAfterEnd.getDate() + 3);
                isOverdue = new Date() > threeDaysAfterEnd;
            }

            return (
              <div key={week.weekIdentifier} className="bg-white shadow-xl rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Week of {week.weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {week.weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <p className="text-sm text-gray-600">Total Hours (Est.): {week.totalHours.toFixed(2)}</p>
                  </div>
                  {isArchive ? (
                     <Button
                        onClick={() => handleExportWeekToCsv(week)}
                        variant="secondary"
                        leftIcon={<DownloadIcon className="w-5 h-5" />}
                        className="w-full sm:w-auto"
                     >
                        Download Again
                     </Button>
                  ) : (
                    <Button
                        onClick={() => handleSubmitAndExportWeek(week)}
                        variant={isOverdue ? 'danger' : 'primary'}
                        leftIcon={!isSubmitting && <DownloadIcon className="w-5 h-s" />}
                        isLoading={isSubmitting}
                        disabled={isSubmitting || week.entries.length === 0 || week.entries.some(e => !e.clockOutTime)}
                        className="w-full sm:w-auto"
                        title={week.entries.some(e => !e.clockOutTime) ? "Cannot submit with open entries" : (userWebhookUrl ? "Submit to Google Sheets" : "Download CSV")}
                    >
                        {isSubmitting ? "Submitting..." : (userWebhookUrl ? "Submit Timesheet" : "Submit & Download")}
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date, Job & Notes</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {week.entries.map(entry => (
                        <TimeEntryRow 
                            key={entry.id} 
                            entry={entry}
                            isEditing={editingEntryId === entry.id}
                            onEdit={setEditingEntryId}
                            onCancel={() => setEditingEntryId(null)}
                            onSave={handleSave}
                            onDelete={handleDelete}
                            jobMap={jobMap}
                            siteMap={siteMap}
                            onAllocate={handleOpenAllocationModal}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};