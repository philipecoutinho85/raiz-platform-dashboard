import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinancialFilters } from '@/hooks/useAdvancedFinancialData';
import { Filter, RefreshCw, X } from 'lucide-react';

interface FinancialFiltersBarProps {
  filters: FinancialFilters;
  onFiltersChange: (filters: FinancialFilters) => void;
}

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const CATEGORIES = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'educacao', label: 'Educação' },
  { value: 'saude', label: 'Saúde' },
  { value: 'meio_ambiente', label: 'Ambiental' },
  { value: 'social', label: 'Social' },
  { value: 'empreendedorismo', label: 'Empreendedorismo' },
  { value: 'bem_estar_animal', label: 'Bem-Estar Animal' },
  { value: 'outros', label: 'Outros' },
];

const PROJECT_STATUS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const FinancialFiltersBar = ({ filters, onFiltersChange }: FinancialFiltersBarProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleMonthChange = (value: string) => {
    onFiltersChange({ ...filters, month: parseInt(value), startDate: '', endDate: '' });
  };

  const handleYearChange = (value: string) => {
    onFiltersChange({ ...filters, year: parseInt(value), startDate: '', endDate: '' });
  };

  const handleStartDateChange = (value: string) => {
    onFiltersChange({ ...filters, startDate: value, month: 0, year: 0 });
  };

  const handleEndDateChange = (value: string) => {
    onFiltersChange({ ...filters, endDate: value, month: 0, year: 0 });
  };

  const handleClearFilters = () => {
    const currentDate = new Date();
    onFiltersChange({
      startDate: '',
      endDate: '',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      category: '',
      status: '',
      state: '',
      city: '',
    });
  };

  const hasActiveFilters = filters.category || filters.status || filters.state || filters.city || filters.startDate;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-background to-muted/30">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Filtros Globais</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="ml-auto">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {/* Month */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Mês</Label>
            <Select 
              value={filters.month?.toString() || ''} 
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ano</Label>
            <Select 
              value={filters.year?.toString() || ''} 
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Data Inicial</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="h-9"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Data Final</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <Select 
              value={filters.category || 'all'} 
              onValueChange={(v) => onFiltersChange({ ...filters, category: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(v) => onFiltersChange({ ...filters, status: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {PROJECT_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* State */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select 
              value={filters.state || 'all'} 
              onValueChange={(v) => onFiltersChange({ ...filters, state: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {BRAZILIAN_STATES.map(state => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cidade</Label>
            <Input
              placeholder="Digite a cidade"
              value={filters.city}
              onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
              className="h-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
