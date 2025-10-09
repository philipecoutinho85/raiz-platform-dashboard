import MaintenanceSettings from './MaintenanceSettings';
import AnalyticsSettings from './AnalyticsSettings';
import ModeratorsSettings from './ModeratorsSettings';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const SettingsTab = () => {
  const { maintenanceMode, analytics, loading, updateMaintenanceMode, updateAnalytics } = useSystemSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MaintenanceSettings settings={maintenanceMode} onUpdate={updateMaintenanceMode} />
      <AnalyticsSettings settings={analytics} onUpdate={updateAnalytics} />
      <ModeratorsSettings />
    </div>
  );
};

export default SettingsTab;
