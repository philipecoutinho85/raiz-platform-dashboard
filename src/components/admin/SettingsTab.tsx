import MaintenanceSettings from './MaintenanceSettings';
import AnalyticsSettings from './AnalyticsSettings';
import ModeratorsSettings from './ModeratorsSettings';
import SocialLinksSettings from './SocialLinksSettings';
import Admin2FAManagement from './Admin2FAManagement';
import BackupSettings from './BackupSettings';
import GoogleAnalyticsSettings from './GoogleAnalyticsSettings';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const SettingsTab = () => {
  const { maintenanceMode, analytics, socialLinks, loading, updateMaintenanceMode, updateAnalytics, updateSocialLinks } = useSystemSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Admin2FAManagement />
      <MaintenanceSettings settings={maintenanceMode} onUpdate={updateMaintenanceMode} />
      <GoogleAnalyticsSettings />
      <AnalyticsSettings settings={analytics} onUpdate={updateAnalytics} />
      <SocialLinksSettings settings={socialLinks} onUpdate={updateSocialLinks} />
      <ModeratorsSettings />
      <BackupSettings />
    </div>
  );
};

export default SettingsTab;
