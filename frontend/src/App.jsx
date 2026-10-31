import { Navigate, Route, Routes } from 'react-router-dom';
import CommandLayout from './components/layout/CommandLayout';
import CitizenLayout from './components/layout/CitizenLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Incidents from './pages/incidents/Incidents';
import IncidentDetails from './pages/incidents/IncidentDetails';
import EmergencyMap from './pages/map/EmergencyMap';
import Intelligence from './pages/intelligence/Intelligence';
import Teams from './pages/teams/Teams';
import TeamsLive from './pages/teams/TeamsLive';
import Safety from './pages/safety/Safety';
import SafetyLive from './pages/safety/SafetyLive';
import Analytics from './pages/analytics/Analytics';
import History from './pages/management/History';
import Settings from './pages/management/Settings';
import CitizenHome from './pages/citizen/CitizenHome';
import ReportForm from './pages/citizen/ReportForm';
import MyReports from './pages/citizen/MyReports';
import Login from './pages/auth/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<CommandLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/incidents/:id" element={<IncidentDetails />} />
        <Route path="/map" element={<EmergencyMap />} />
        <Route path="/intelligence" element={<Intelligence />} />
        <Route path="/teams" element={<TeamsLive />} />
        <Route path="/safety" element={<SafetyLive />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route element={<CitizenLayout />}>
        <Route path="/citizen" element={<CitizenHome />} />
        <Route path="/citizen/report" element={<ReportForm />} />
        <Route path="/citizen/reports" element={<MyReports />} />
        <Route path="/citizen/safety" element={<SafetyLive />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
