import React, { useState, useEffect } from 'react';
import { User, AppView } from './types';
import { authService } from './services/authService';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { PageLayout } from './components/PageLayout';
import { LoadingSpinner } from './components/LoadingSpinner';

// Employee Pages
import { ClockInOutPage } from './components/ClockInOutPage';
import { DailyJobsPage } from './components/DailyJobsPage';
import { TimesheetsPage } from './components/TimesheetsPage';

// Admin Pages
import { AdminJobManagementPage } from './components/admin/AdminJobManagementPage';
import { AdminUserManagementPage } from './components/admin/AdminUserManagementPage';
import { AdminTimesheetReportsPage } from './components/admin/AdminTimesheetReportsPage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [isLoading, setIsLoading] = useState(true); // For initial auth check

  useEffect(() => {
    // Subscribe to Firebase auth state changes. This should only run once.
    const unsubscribe = authService.onAuthChange(user => {
      setCurrentUser(user);
      setIsLoading(false);

      if (user) {
        // If a user is authenticated, we check the previous view state.
        // If the user was on the login screen, we transition them to the dashboard.
        // This handles the initial login flow correctly.
        // If they were on another screen (e.g., on a page refresh), we keep them there.
        setCurrentView(prevView => 
          prevView === AppView.LOGIN ? AppView.DASHBOARD : prevView
        );
      } else {
        // If no user is authenticated (e.g., initial load or after logout),
        // always show the login screen.
        setCurrentView(AppView.LOGIN);
      }
    });

    // Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only on mount and unmount.


  const handleLoginSuccess = (user: User) => {
    // The onAuthChange listener will handle setting the user and navigating to the dashboard.
    // This function is kept for clarity but the primary logic is in the listener.
  };

  const handleLogout = async () => {
    await authService.logout();
    // The onAuthChange listener will handle setting user to null and view to LOGIN
  };

  const navigateToDashboard = () => setCurrentView(AppView.DASHBOARD);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner size="lg" color="text-blue-500" />
      </div>
    );
  }

  if (!currentUser || currentView === AppView.LOGIN) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  const pageTitles: Record<string, string> = {
    [AppView.LOGIN]: "Login",
    [AppView.DASHBOARD]: "Dashboard",
    [AppView.CLOCK_IN_OUT]: "Clock In/Out",
    [AppView.WEEKLY_SCHEDULE]: "Weekly Schedule",
    [AppView.TIMESHEETS]: "My Timesheets",
    [AppView.ADMIN_JOB_MANAGEMENT]: "Job Management",
    [AppView.ADMIN_USER_MANAGEMENT]: "User Management",
    [AppView.ADMIN_TIMESHEET_REPORTS]: "Timesheet Reports",
  };

  const renderView = () => {
    const isAdminView = [
        AppView.ADMIN_JOB_MANAGEMENT, 
        AppView.ADMIN_USER_MANAGEMENT, 
        AppView.ADMIN_TIMESHEET_REPORTS
    ].includes(currentView);

    if (isAdminView && currentUser.role !== 'Admin') {
        console.warn("Attempted admin access by non-admin user. Redirecting to dashboard.");
        setCurrentView(AppView.DASHBOARD);
        return <Dashboard user={currentUser} setCurrentView={setCurrentView} />;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard user={currentUser} setCurrentView={setCurrentView} />;
      case AppView.CLOCK_IN_OUT:
        return <ClockInOutPage user={currentUser} />;
      case AppView.WEEKLY_SCHEDULE:
        return <DailyJobsPage user={currentUser} />;
      case AppView.TIMESHEETS:
        return <TimesheetsPage user={currentUser} />;
      case AppView.ADMIN_JOB_MANAGEMENT:
        return <AdminJobManagementPage />;
      case AppView.ADMIN_USER_MANAGEMENT:
        return <AdminUserManagementPage />;
      case AppView.ADMIN_TIMESHEET_REPORTS:
        return <AdminTimesheetReportsPage />;
      default:
        setCurrentView(AppView.DASHBOARD);
        return <Dashboard user={currentUser} setCurrentView={setCurrentView} />;
    }
  };
  
  const showBackButton = currentView !== AppView.DASHBOARD;

  return (
    <PageLayout 
      user={currentUser} 
      onLogout={handleLogout} 
      onNavigateBack={showBackButton ? navigateToDashboard : undefined}
      pageTitle={pageTitles[currentView] || "R&L Hub"}
    >
      {renderView()}
    </PageLayout>
  );
};

export default App;