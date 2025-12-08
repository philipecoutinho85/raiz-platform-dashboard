import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FilterState } from './SupportDashboard';
import { Search, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupportFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const SupportFilters = ({ filters, onFiltersChange }: SupportFiltersProps) => {
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value as FilterState['status']
    });
  };

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomDateOpen(true);
    }
    onFiltersChange({
      ...filters,
      period: value as FilterState['period'],
      startDate: value === 'custom' ? filters.startDate : undefined,
      endDate: value === 'custom' ? filters.endDate : undefined
    });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchTerm: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      period: '30days',
      searchTerm: ''
    });
  };

  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.period !== '30days' || 
    filters.searchTerm !== '' ||
    filters.userId;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por assunto..."
          value={filters.searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 w-64"
        />
      </div>

      {/* Status Filter */}
      <Select value={filters.status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="open">Abertos</SelectItem>
          <SelectItem value="closed">Fechados</SelectItem>
          <SelectItem value="in_progress">Em Andamento</SelectItem>
        </SelectContent>
      </Select>

      {/* Period Filter */}
      <Select value={filters.period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="7days">Últimos 7 dias</SelectItem>
          <SelectItem value="30days">Últimos 30 dias</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Date Range */}
      {filters.period === 'custom' && (
        <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {filters.startDate && filters.endDate 
                ? `${format(filters.startDate, 'dd/MM', { locale: ptBR })} - ${format(filters.endDate, 'dd/MM', { locale: ptBR })}`
                : 'Selecionar datas'
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Data Inicial</p>
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => onFiltersChange({ ...filters, startDate: date })}
                  locale={ptBR}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Data Final</p>
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => {
                    onFiltersChange({ ...filters, endDate: date });
                    setIsCustomDateOpen(false);
                  }}
                  locale={ptBR}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={clearFilters}
          className="gap-1"
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
};

export default SupportFilters;
