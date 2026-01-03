// FILE: hooks/useFlights.ts
import { useQuery } from '@tanstack/react-query';
import { flightService, SearchParams as ServiceSearchParams } from '../lib/services/flightService';
import { FlightItem } from '../types';

interface SearchParams extends ServiceSearchParams { }

const fetchFlights = async (params: SearchParams): Promise<FlightItem[]> => {
  return await flightService.searchFlights(params);
};

export const useFlights = (params: SearchParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['flights', params],
    queryFn: () => fetchFlights(params),
    enabled: options?.enabled !== false && !!params.origin && !!params.destination && !!params.date,
  });
};
