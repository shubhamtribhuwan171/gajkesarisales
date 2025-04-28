import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FiUsers, FiBarChart2, FiMap, FiPieChart, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import NewCustomersReport from '../components/NewCustomersReport';
import SalesPerformanceReport from '../components/SalesPerformanceReport';
import VisitFrequencyReport from '../components/VisitFrequencyReport';
import CustomerTypeAnalysisReport from '../components/CustomerTypeAnalysisReport';
import TotalSalesReport from '../components/TotalSalesReport';
import './Report.css'

const Reports = () => {
    const [activeTab, setActiveTab] = useState('newCustomers');

    const tabs = [
        { id: 'newCustomers', label: 'New Customers Acquired', icon: FiUsers, description: 'View statistics on new customers acquired by employees' },
        { id: 'salesPerformance', label: 'Sales Performance', icon: FiBarChart2, description: 'Analyze sales performance across different products and regions' },
        { id: 'visitFrequency', label: 'Visit Frequency', icon: FiMap, description: 'Analyze visit frequency, intent level, and monthly sales by employee' },
        { id: 'customerTypeAnalysis', label: 'Customer Type Analysis', icon: FiPieChart, description: 'Analyze customer types for each employee' },
        // { id: 'dailyPricing', label: 'Daily Pricing', icon: FiDollarSign, description: 'Compare daily pricing from brands for each city' },
        { id: 'totalSales', label: 'Total Sales', icon: FiTrendingUp, description: 'View total sales filtered by store and date range' },
    ];

    return (
        <div className="container-reports mx-auto px-4 py-4 max-w-[1600px]">
            <div className="container-header-reports mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
            </div>
            
            {/* Tabs Navigation - Updated for Wrapping */}
            <div className="flex flex-wrap gap-4 pb-4 mb-6"> 
                {/* Removed the inner div with min-w-max */}
                {tabs.map((tab) => (
                    <Card
                        key={tab.id}
                        className={`report-card cursor-pointer transition-all duration-200 hover:shadow-lg ${
                            activeTab === tab.id ? 'active-card ring-2 ring-primary ring-offset-2' : ''
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                        // Using flex-basis for better control with wrapping, remove maxWidth if using this
                        // minWidth still useful as a minimum size guarantee.
                        style={{ flexBasis: '260px', minWidth: '240px', flexGrow: 1 }}
                    >
                        <CardContent className="card-glass-effect p-4 h-full flex flex-col"> {/* Ensure content fills height */} 
                            <div className="report-card-icon text-primary mb-2"> {/* Added margin bottom */} 
                                <tab.icon size={24} />
                            </div>
                            <h3 className="report-card-title text-lg font-semibold mt-2">{tab.label}</h3>
                            <p className="report-card-description text-sm text-gray-600 mt-1 flex-grow">{tab.description}</p> {/* Allow description to grow */} 
                            {/* Removed card-shine div unless it serves a specific purpose beyond visuals */}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Report Content */}
            <div className="report-content bg-gray-50 rounded-lg p-6">
                {activeTab === 'newCustomers' && <NewCustomersReport />}
                {activeTab === 'salesPerformance' && <SalesPerformanceReport />}
                {activeTab === 'visitFrequency' && <VisitFrequencyReport />}
                {activeTab === 'customerTypeAnalysis' && <CustomerTypeAnalysisReport />}
                {activeTab === 'totalSales' && <TotalSalesReport />}
                {/* {activeTab === 'dailyPricing' && <DailyPricingReport />} */}
            </div>
        </div>
    );
};

export default Reports;