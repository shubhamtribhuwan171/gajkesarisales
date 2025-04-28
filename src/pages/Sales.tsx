import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import styles from './Sales.module.css';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Define types for API responses
interface StoreName {
  id: number;
  storeName: string;
}

interface StoreDetails {
  employeeId: number;
  employeeName: string;
  // Add other fields if needed
}

// Define type for sales records - including desired columns, expecting nulls from API
interface SaleRecord {
  id: number;
  storeId: number;
  employeeId: number;
  storeName: string | null; // Add back, expect null
  employeeName: string | null; // Add back, expect null
  storeCity: string | null; // Add back, expect null/missing
  storeState: string | null; // Add back, expect null/missing
  tons: number;
  createdAt: string;
}

// Interface for Summary Data
interface SalesSummaryData {
  employeeId: number;
  employeeName: string;
  totalTons: number;
  storeId: number;
  storeName: string;
}

const Sales: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [fieldOfficer, setFieldOfficer] = useState('');
  const [fieldOfficerId, setFieldOfficerId] = useState<number | null>(null);
  const [tons, setTons] = useState<string>('');
  const [date, setDate] = useState<string>('');

  // State for API data and loading/error
  const [storesList, setStoresList] = useState<StoreName[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingOfficer, setIsLoadingOfficer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // State for sales table data
  const [salesData, setSalesData] = useState<SaleRecord[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(true); // Start loading initially
  const [salesError, setSalesError] = useState<string | null>(null);

  // Add state for table search
  const [tableSearchTerm, setTableSearchTerm] = useState('');

  // Add state for active tab
  const [activeTab, setActiveTab] = useState('log');

  // State for Summary Tab
  const [summaryStoreId, setSummaryStoreId] = useState<string>('');
  const [summaryStartDate, setSummaryStartDate] = useState<Date | undefined>();
  const [summaryEndDate, setSummaryEndDate] = useState<Date | undefined>();
  const [summaryData, setSummaryData] = useState<SalesSummaryData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const getToken = (): string | null => localStorage.getItem('token');

  // Define fetchStores using useCallback (no longer tied only to modal)
  const fetchStores = useCallback(async () => {
    // Prevent refetch if already loading or list has data
    if (isLoadingStores || storesList.length > 0) return;
    
    setIsLoadingStores(true);
    setApiError(null); // Clear general API errors
    const token = getToken();
    if (!token) {
      setApiError("Authentication token not found.");
      setIsLoadingStores(false);
      return;
    }

    try {
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
      setApiError("Failed to load stores. Please try again.");
      setStoresList([]);
    }
    setIsLoadingStores(false);
  }, [isLoadingStores, storesList.length]);

  // Fetch stores on mount and when summary tab is active (if needed)
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchStores(); // Ensure stores are fetched for summary tab if not already done
    }
  }, [activeTab, fetchStores]);

  // Fetch field officer when store selection changes
  useEffect(() => {
    if (selectedStoreId) {
      const fetchStoreDetails = async () => {
        setIsLoadingOfficer(true);
        setApiError(null);
        setFieldOfficer('');
        setFieldOfficerId(null);
        const token = getToken();
        if (!token) {
          setApiError("Authentication token not found.");
          setIsLoadingOfficer(false);
          return;
        }

        try {
          const response = await fetch(`https://api.gajkesaristeels.in/store/getById?id=${selectedStoreId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: StoreDetails = await response.json();
          setFieldOfficer(data?.employeeName || 'N/A');
          setFieldOfficerId(data?.employeeId || null);
        } catch (error) {
          console.error("Error fetching store details:", error);
          setApiError("Failed to load field officer details.");
          setFieldOfficer('Error');
          setFieldOfficerId(null);
        }
        setIsLoadingOfficer(false);
      };
      fetchStoreDetails();
    } else {
      setFieldOfficer('');
      setFieldOfficerId(null);
    }
  }, [selectedStoreId]);

  // Fetch sales data function (Refactored to use fetch)
  const fetchSalesData = useCallback(async () => {
    console.log("Attempting to fetch sales data...");
    setIsLoadingSales(true);
    setSalesError(null);
    const token = getToken();
    if (!token) {
      setSalesError("Authentication token not found. Cannot load sales data.");
      setIsLoadingSales(false);
      return;
    }

    try {
      const response = await fetch('https://api.gajkesaristeels.in/sales/getAll', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SaleRecord[] = await response.json();

      const sortedData = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSalesData(sortedData || []);
      console.log("Sales data fetched successfully.");
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setSalesError("Failed to load sales data. Please try again.");
      setSalesData([]);
    } finally {
      setIsLoadingSales(false);
    }
  }, []);

  // Initial fetch for sales data
  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  // Fetch Summary Data Logic
  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!summaryStoreId || !summaryStartDate || !summaryEndDate) {
        // Don't fetch if parameters are missing
        setSummaryData(null); // Clear previous data if selection becomes incomplete
        return;
      }

      setIsLoadingSummary(true);
      setSummaryError(null);
      setSummaryData(null); // Clear previous data before fetching
      const token = getToken();

      if (!token) {
        setSummaryError("Authentication token not found.");
        setIsLoadingSummary(false);
        return;
      }

      const formattedStartDate = format(summaryStartDate, 'yyyy-MM-dd');
      const formattedEndDate = format(summaryEndDate, 'yyyy-MM-dd');

      try {
        const url = `https://api.gajkesaristeels.in/sales/totalTonsByStore?storeId=${summaryStoreId}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
        const response = await axios.get<SalesSummaryData>(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSummaryData(response.data);
      } catch (error) {
        console.error("Error fetching sales summary:", error);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setSummaryError("No sales data found for the selected store and date range.");
        } else {
          setSummaryError("Failed to load sales summary. Please try again.");
        }
        setSummaryData(null);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchSummaryData();
  }, [summaryStoreId, summaryStartDate, summaryEndDate]); // Re-run effect when these change

  const handleAddSaleClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset form fields and state
    setSelectedStoreId('');
    setFieldOfficer('');
    setFieldOfficerId(null);
    setTons('');
    setDate('');
    setStoresList([]);
    setApiError(null);
    setIsSaving(false);
  };

  const handleSave = async () => {
    // Log the values being checked for debugging
    console.log('Validating save data:', { 
      selectedStoreId, 
      fieldOfficerId, 
      officeManagerId: 86,
      tons, 
      date 
    });

    // General check for other fields (now excludes loggedInUserId)
    if (!selectedStoreId || !fieldOfficerId || !tons || !date) {
      setApiError("Please ensure Store, Field Officer (auto-filled), Tons, and Date are correctly filled.");
      return;
    }

    setIsSaving(true);
    setApiError(null);
    const token = getToken();

    if (!token) {
      setApiError("Authentication token not found. Cannot save.");
      setIsSaving(false);
      return;
    }

    const payload = {
      employeeId: fieldOfficerId,
      storeId: parseInt(selectedStoreId, 10),
      officeManagerId: 86,
      tons: parseFloat(tons),
    };

    try {
      const response = await fetch('https://api.gajkesaristeels.in/sales/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Sale created successfully, response:", data);
      fetchSalesData(); // Refresh sales data after successful save
      handleCloseModal(); // Close modal on success
    } catch (error) {
      console.error("Error creating sale:", error);
      setApiError("An unexpected error occurred while saving the sale.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter sales data based on table search term
  const filteredSalesData = salesData.filter(sale => {
    const searchTermLower = tableSearchTerm.toLowerCase();
    // Ensure checks handle potential nulls and convert tons to string for includes
    return (
      (sale.storeName?.toLowerCase() || '').includes(searchTermLower) ||
      (sale.employeeName?.toLowerCase() || '').includes(searchTermLower) ||
      (sale.storeCity?.toLowerCase() || '').includes(searchTermLower) ||
      (sale.storeState?.toLowerCase() || '').includes(searchTermLower) ||
      String(sale.tons).toLowerCase().includes(searchTermLower) // Correctly check tons
    );
  });

  return (
    <>
      <main className={styles.salesMainContent}>
        <div className={styles.header}>
          <h1>Sales Records</h1>
          <Button onClick={handleAddSaleClick} variant="default" size="lg">
            Add Sale
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabsContainer}>
          <TabsList>
            <TabsTrigger value="log">Sales Log</TabsTrigger>
            <TabsTrigger value="summary">Sales Summary</TabsTrigger>
          </TabsList>

          {/* Sales Log Tab Content */}
          <TabsContent value="log" className={styles.tabsContent}>
            {/* Table Search Input */}
            <div className={styles.tableSearchContainer}> 
              <div className={styles.searchInputWrapper}>
                <Search className={styles.searchIcon} />
                <Input 
                  type="text"
                  placeholder="Search sales log..."
                  value={tableSearchTerm}
                  onChange={(e) => setTableSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            {/* Sales Data Table Section */}
            <div className={styles.tableContainer}> 
              {isLoadingSales ? (
                <div className={styles.loadingContainer}>
                  <Loader className="animate-spin h-8 w-8 text-primary" />
                  <p>Loading sales log...</p>
                </div>
              ) : salesError ? (
                <div className={styles.errorContainer}>
                  <p className={styles.errorMessage}>{salesError}</p>
                  <Button onClick={fetchSalesData} variant="outline" size="sm">Retry</Button>
                </div>
              ) : salesData.length === 0 ? (
                <div className={styles.emptyStateContainer}>
                  <p>No sales records created yet.</p>
                </div>
              ) : filteredSalesData.length === 0 ? ( 
                <div className={styles.emptyStateContainer}>
                  <p>No records match your search "{tableSearchTerm}".</p>
                </div>
              ) : (
                <Table className={styles.salesTableFont}>
                  <TableHeader className={styles.salesTableHeader}>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Tons</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Map over filtered data */}
                    {filteredSalesData.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.storeName || '-'}</TableCell>
                        <TableCell>{sale.employeeName || '-'}</TableCell>
                        <TableCell>{sale.storeCity || '-'}</TableCell> 
                        <TableCell>{sale.storeState || '-'}</TableCell>
                        <TableCell className="text-right">{sale.tons}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Sales Summary Tab Content */}
          <TabsContent value="summary" className={styles.tabsContent}>
            <div className={styles.summaryControls}>
              {/* Store Selector */}
              <div className={styles.summaryControlItem}>
                <Label htmlFor="summaryStore">Select Store</Label>
                <Select
                  value={summaryStoreId}
                  onValueChange={setSummaryStoreId}
                  disabled={storesList.length === 0}
                >
                  <SelectTrigger id="summaryStore" className={styles.summarySelectTrigger}>
                    <SelectValue placeholder="Select a store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {storesList.length > 0 ? (
                      storesList.map((store) => (
                        <SelectItem key={store.id} value={String(store.id)}>
                          {store.storeName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-stores" disabled>
                        Loading stores...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date Picker */}
              <div className={styles.summaryControlItem}>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        styles.datePickerButton,
                        !summaryStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {summaryStartDate ? format(summaryStartDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={cn("w-auto p-0", styles.dropdownContentAboveModal)}>
                    <Calendar
                      mode="single"
                      selected={summaryStartDate}
                      onSelect={setSummaryStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date Picker */}
              <div className={styles.summaryControlItem}>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        styles.datePickerButton,
                        !summaryEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {summaryEndDate ? format(summaryEndDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={cn("w-auto p-0", styles.dropdownContentAboveModal)}>
                    <Calendar
                      mode="single"
                      selected={summaryEndDate}
                      onSelect={setSummaryEndDate}
                      disabled={(date) =>
                        summaryStartDate ? date < summaryStartDate : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Summary Display Area */}
            <div className={styles.summaryDisplayArea}>
              {isLoadingSummary ? (
                <div className={styles.loadingContainer}>
                  <Loader className="animate-spin h-6 w-6 text-primary" />
                  <p>Loading summary...</p>
                </div>
              ) : summaryError ? (
                <div className={styles.errorContainer}>
                  <p className={styles.errorMessage}>{summaryError}</p>
                </div>
              ) : !summaryStoreId || !summaryStartDate || !summaryEndDate ? (
                // Display Sales Log Table by default
                <div className={styles.tableContainer}> 
                  {isLoadingSales ? (
                    <div className={styles.loadingContainer}>
                      <Loader className="animate-spin h-8 w-8 text-primary" />
                      <p>Loading sales log...</p>
                    </div>
                  ) : salesError ? (
                    <div className={styles.errorContainer}>
                      <p className={styles.errorMessage}>{salesError}</p>
                      <Button onClick={fetchSalesData} variant="outline" size="sm">Retry</Button>
                    </div>
                  ) : salesData.length === 0 ? (
                    <div className={styles.emptyStateContainer}>
                      <p>No sales records created yet.</p>
                    </div>
                  ) : filteredSalesData.length === 0 ? ( 
                    <div className={styles.emptyStateContainer}>
                      <p>No records match your search "{tableSearchTerm}".</p>
                    </div>
                  ) : (
                    <Table className={styles.salesTableFont}>
                      <TableHeader className={styles.salesTableHeader}>
                        <TableRow>
                          <TableHead>Store Name</TableHead>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead className="text-right">Tons</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Map over filtered data */}
                        {filteredSalesData.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>{sale.storeName || '-'}</TableCell>
                            <TableCell>{sale.employeeName || '-'}</TableCell>
                            <TableCell>{sale.storeCity || '-'}</TableCell> 
                            <TableCell>{sale.storeState || '-'}</TableCell>
                            <TableCell className="text-right">{sale.tons}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : summaryData ? (
                summaryData.totalTons > 0 ? (
                  <div className={styles.summaryResults}>
                    <h3>Summary for {summaryData.storeName}</h3>
                    <p><strong>Field Officer:</strong> {summaryData.employeeName}</p>
                    <p><strong>Total Tons Sold:</strong> {summaryData.totalTons}</p>
                  </div>
                ) : (
                  <p className={styles.summaryPrompt}>No tons were recorded for "{summaryData.storeName}" during the selected period.</p>
                )
              ) : (
                <p className={styles.summaryPrompt}>No summary data available for the selection.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <h2>Add New Sale</h2>
              {apiError && <p className={styles.errorMessage}>{apiError}</p>}
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className={styles.formGroup}>
                  <Label htmlFor="store">Store Selection</Label>
                  <Select
                    value={selectedStoreId}
                    onValueChange={setSelectedStoreId}
                    disabled={isLoadingStores}
                  >
                    <SelectTrigger id="store">
                      <SelectValue placeholder={isLoadingStores ? "Loading stores..." : "Select a store"} />
                    </SelectTrigger>
                    <SelectContent className={styles.dropdownContentAboveModal}>
                      {storesList.length > 0 ? (
                        storesList.map((store) => (
                          <SelectItem key={store.id} value={String(store.id)}>
                            {store.storeName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-stores" disabled>
                          {isLoadingStores ? "Loading..." : "No stores found"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className={styles.formGroup}>
                  <Label htmlFor="fieldOfficer">Field Officer Name</Label>
                  <Input
                    type="text"
                    id="fieldOfficer"
                    value={isLoadingOfficer ? "Loading..." : fieldOfficer}
                    placeholder="Select a store to see officer"
                    readOnly
                    disabled
                    className={styles.readOnlyInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Label htmlFor="tons">Tons</Label>
                  <Input
                    type="number"
                    id="tons"
                    value={tons}
                    onChange={(e) => setTons(e.target.value)}
                    placeholder="Enter tons"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(new Date(date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={cn("w-auto p-0", styles.dropdownContentAboveModal)}>
                      <Calendar
                        mode="single"
                        selected={date ? new Date(date) : undefined}
                        onSelect={(selectedDate) =>
                          setDate(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className={styles.modalActions}>
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isLoadingOfficer || isLoadingStores || !selectedStoreId || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Sale'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Sales; 