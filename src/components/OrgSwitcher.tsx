import { useOrg } from '@/contexts/OrgContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

const OrgSwitcher = () => {
  const { organizations, currentOrg, switchOrg } = useOrg();
  const { t } = useLanguage();

  if (organizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[140px] truncate">{currentOrg?.name || t('noOrganization')}</span>
      </div>
    );
  }

  return (
    <Select value={currentOrg?.id || ''} onValueChange={switchOrg}>
      <SelectTrigger className="h-8 w-[180px] gap-2 border-border/50 text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {organizations.map(org => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default OrgSwitcher;
