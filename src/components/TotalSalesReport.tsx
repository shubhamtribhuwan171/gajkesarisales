import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import styles from './TotalSalesReport.module.css';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface StoreName {
  id: number;
  storeName: string;
}

// Updated interface based on Sales.tsx SalesSummaryData
interface TotalSalesData {
  employeeId?: number; // Optional, may not always be relevant/present
  employeeName?: string; // Optional
  totalTons: number;
  storeId: number;
  storeName: string;
}

const TotalSalesReport: React.FC = () => {
  // State for Filters
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // State for Store List
  const [storesList, setStoresList] = useState<StoreName[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  // State for Sales Data
  const [salesData, setSalesData] = useState<TotalSalesData | null>(null);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  const getToken = (): string | null => localStorage.getItem('token');

  // Fetch Store Names
  const fetchStores = useCallback(async () => {
    if (isLoadingStores || storesList.length > 0) return; // Prevent refetch

    setIsLoadingStores(true);
    setStoreError(null);
    const token = getToken();
    if (!token) {
      setStoreError("Authentication token not found.");
      setIsLoadingStores(false);
      return;
    }

    try {
      // Using the new endpoint provided
      const response = await fetch('https://api.gajkesaristeels.in/store/names', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StoreName[] = await response.json();
      setStoresList(data || []);
    } catch (error) {
      console.error("Error fetching store names:", error);
      setStoreError("Failed to load stores. Please try again.");
      setStoresList([]); // Clear list on error
    } finally {
      setIsLoadingStores(false);
    }
  }, [isLoadingStores, storesList.length]); // Dependencies for useCallback

  // Fetch stores on component mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Fetch Total Sales Data (Updated with actual API call)
  const fetchTotalSales = useCallback(async () => {
    if (!selectedStoreId || !startDate || !endDate) {
        setSalesData(null);
        setSalesError(null); // Clear errors if filters are incomplete
        return;
    }

    console.log("Attempting to fetch total sales data...");
    setIsLoadingSales(true);
    setSalesError(null);
    setSalesData(null);
    const token = getToken();

    if (!token) {
      setSalesError("Authentication token not found.");
      setIsLoadingSales(false);
      return;
    }

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    // Construct the actual API URL
    const actualApiUrl = `https://api.gajkesaristeels.in/sales/totalTonsByStore?storeId=${selectedStoreId}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
    console.log(`Fetching total sales from: ${actualApiUrl}`);

    try {
      const response = await axios.get<TotalSalesData>(actualApiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesData(response.data);
      console.log("Total sales data fetched successfully:", response.data);

    } catch (error) {
        console.error("Error fetching total sales data:", error);
        // Handle specific 404 error like in Sales.tsx
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setSalesError(`No sales data found for the selected store and date range.`);
          // Optionally set salesData to a state indicating no data found, e.g. { totalTons: 0, ... }
          // Or just leave it null and let the UI handle the error message.
          setSalesData(null); // Ensure data is null on 404
        } else {
          setSalesError("Failed to load total sales data. Please check your connection or try again.");
          setSalesData(null);
        }
    } finally {
      setIsLoadingSales(false);
    }
  }, [selectedStoreId, startDate, endDate]); // Dependencies

  // Trigger fetchTotalSales when filters change
  useEffect(() => {
    // Debounce or throttle this if needed, but for now, fetch on any filter change
    fetchTotalSales();
  }, [fetchTotalSales]); // fetchTotalSales itself depends on the filters

  return (
    <div className={cn(styles.reportContainer, 'bg-white', 'p-4', 'rounded-lg')}>
      <h2 className={styles.reportTitle}>Total Sales Report</h2>

      {/* Filter Controls */}
      <div className={styles.filterControls}>
        {/* Store Selector */}
        <div className={styles.filterItem}>
          <Label htmlFor="totalSalesStore">Select Store</Label>
          <Select
            value={selectedStoreId}
            onValueChange={setSelectedStoreId}
            disabled={isLoadingStores || storesList.length === 0}
          >
            <SelectTrigger id="totalSalesStore" className={styles.selectTrigger}>
              <SelectValue placeholder={isLoadingStores ? "Loading stores..." : "Select a store..."} />
            </SelectTrigger>
            <SelectContent>
              {storeError ? (
                 <SelectItem value="error" disabled>{storeError}</SelectItem>
              ) : isLoadingStores ? (
                 <SelectItem value="loading" disabled>Loading stores...</SelectItem>
              ) : storesList.length > 0 ? (
                storesList.map((store) => (
                  <SelectItem key={store.id} value={String(store.id)}>
                    {store.storeName}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-stores" disabled>
                  No stores available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Picker */}
        <div className={styles.filterItem}>
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  styles.datePickerButton,
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) =>
                  endDate ? date > endDate : false
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date Picker */}
        <div className={styles.filterItem}>
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  styles.datePickerButton,
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) =>
                  startDate ? date < startDate : false
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Results Area (Metric Card + Chart) */}
      <div className={styles.resultsArea}>
        {isLoadingSales ? (
          <div className={styles.loadingContainer}>
            <Loader className="animate-spin h-6 w-6 text-primary" />
            <p>Loading total sales...</p>
          </div>
        ) : !selectedStoreId || !startDate || !endDate ? (
          <p className={styles.promptMessage}>Please select a store and date range to view total sales.</p>
        ) : salesError ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{salesError}</p>
             <Button onClick={fetchTotalSales} variant="outline" size="sm" disabled={isLoadingSales}>Retry</Button>
          </div>
        ) : salesData !== null ? (
          // Display Metric Card AND Chart
          <div className={styles.resultsContent}> 
            {/* Metric Card (keep this) */} 
            <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                    Total Sales for {salesData.storeName || storesList.find(s => String(s.id) === selectedStoreId)?.storeName || 'Selected Store'}
                    {salesData.employeeName && (
                        <span className={styles.metricSubHeader}> (Field Officer: {salesData.employeeName})</span>
                    )}
                </div>
                <div className={styles.metricValue}>
                    {salesData.totalTons}
                </div>
                <div className={styles.metricLabel}>
                    Tons Sold
                </div>
                {startDate && endDate && (
                     <div className={styles.metricDateRange}>
                        ({format(startDate, "PPP")} - {format(endDate, "PPP")})
                    </div>
                )}
                {/* Message if zero tons */}
                {salesData.totalTons === 0 && (
                    <p className={styles.zeroTonsMessage}>No tons were recorded for the selected criteria.</p>
                )}
            </div>
            
            {/* Re-introduce Chart Container, conditional on totalTons > 0 */}
            {salesData.totalTons > 0 && (
                <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={[{ name: salesData.storeName || 'Selected Store', tons: salesData.totalTons }]} // Data for the single bar
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Tons', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => [`${value} Tons`, 'Total Sales']} />
                            <Legend />
                            <Bar dataKey="tons" fill="#8884d8" name="Total Tons Sold" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            
            {/* Removed the context note about data limitations */}
          </div>
        ) : (
           <p className={styles.promptMessage}>No data available for the selected criteria.</p>
        )}
      </div>
    </div>
  );
};

export default TotalSalesReport; 