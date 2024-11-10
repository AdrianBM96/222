import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { Candidatures } from './components/candidatures/Candidatures';
import { CandidateSearch } from './components/candidate-search/CandidateSearch';
import { FormsList } from './components/forms/FormsList';
import { HiringList } from './components/hiring/HiringList';
import { LinkedInInbox } from './components/linkedin-inbox/LinkedInInbox';
import { Interviews } from './components/interviews/Interviews';
import { Settings } from './components/settings/Settings';
import { SettingsLayout } from './components/settings/SettingsLayout';
import { AccountsSettings } from './components/settings/AccountsSettings';
import { ProfileSettings } from './components/settings/ProfileSettings';
import { CalendarSettings } from './components/settings/CalendarSettings';
import { NotificationsSettings } from './components/settings/NotificationsSettings';

import { Login } from './components/Login';
import { PublicPage } from './components/public/PublicPage';
import { Campaigns } from './components/campaigns/Campaigns';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [showRecruitmentMenu, setShowRecruitmentMenu] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/company/:companyId" element={<PublicPage />} />
        <Route
          path="*"
          element={
            user ? (
              <div className="flex h-screen bg-gray-50">
                <Sidebar 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab}
                  setShowRecruitmentMenu={setShowRecruitmentMenu}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header user={user} showRecruitmentMenu={showRecruitmentMenu} />
                  <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/campaigns" element={<Campaigns />} />
                      <Route path="/candidatures" element={<Candidatures />} />
                      <Route path="/candidates" element={<CandidateSearch />} />
                      <Route path="/forms" element={<FormsList />} />
                      <Route path="/hiring" element={<HiringList />} />
                      <Route path="/linkedin-inbox" element={<LinkedInInbox />} />
                      <Route path="/interviews" element={<Interviews />} />
                      <Route path="/settings" element={<SettingsLayout />}>
                        <Route index element={<ProfileSettings />} />
                        <Route path="profile" element={<ProfileSettings />} />
                        <Route path="accounts" element={<AccountsSettings />} />
                        <Route path="calendar" element={<CalendarSettings />} />
                        <Route path="notifications" element={<NotificationsSettings />} />
                      </Route>
                    </Routes>
                  </main>
                </div>
              </div>
            ) : (
              <Login />
            )
          }
        />
      </Routes>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </Router>
  );
}

export default App;


