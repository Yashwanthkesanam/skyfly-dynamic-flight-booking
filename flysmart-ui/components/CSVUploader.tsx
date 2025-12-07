// components/CSVUploader.tsx
"use client";

import React, { useState } from 'react';
import { showSuccess, showError, showInfo } from '../lib/utils/toast';
import LoadingSpinner from './LoadingSpinner';
import { CloudArrowUpIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface UploadResult {
    success: number;
    failed: number;
    errors: string[];
}

export default function CSVUploader() {
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [preview, setPreview] = useState<any[]>([]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            showError('Please upload a CSV file');
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            // Send file directly to backend
            const formData = new FormData();
            formData.append('file', file);
            formData.append('update_duplicates', 'true');

            const response = await fetch('/api/v1/admin/flights/bulk-upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Upload failed');
            }

            const data: UploadResult = await response.json();

            setResult(data);

            if (data.errors.length === 0) {
                showSuccess(`Successfully uploaded ${data.success} flights!`);
            } else {
                showInfo(`Uploaded ${data.success} flights with ${data.failed} errors`);
            }

            // Setup preview locally for immediate feedback (optional, but good UX)
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length > 1) {
                const headers = lines[0].split(',').map(h => h.trim());
                const flights = [];
                for (let i = 1; i < Math.min(lines.length, 6); i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    if (values.length === headers.length) {
                        const flight: any = {};
                        headers.forEach((h, idx) => flight[h] = values[idx]);
                        flights.push(flight);
                    }
                }
                setPreview(flights);
            }

        } catch (error: any) {
            showError(error.message || 'Failed to process CSV file');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const template = `flight_number,airline,origin,destination,departure_iso,arrival_iso,duration_min,price_real,base_price,seats_total,seats_available,flight_date
AI101,Air India,DEL,BOM,2025-12-10T10:00:00,2025-12-10T12:30:00,150,5500,5000,180,150,2025-12-10
6E202,IndiGo,BOM,BLR,2025-12-10T14:00:00,2025-12-10T15:30:00,90,4800,4500,180,120,2025-12-10`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flight_template.csv';
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Template downloaded!');
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
                <CloudArrowUpIcon className="w-8 h-8 text-blue-600" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Flights</h2>
                    <p className="text-sm text-gray-600">Upload CSV file to add multiple flights at once</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors mb-6">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer block">
                    <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                        {uploading ? 'Processing...' : 'Click to upload CSV file'}
                    </p>
                    <p className="text-sm text-gray-500">
                        Supported format: CSV with headers
                    </p>
                </label>

                {uploading && (
                    <div className="mt-4">
                        <LoadingSpinner size="lg" color="blue" />
                        <p className="text-sm text-gray-600 mt-2">Uploading and processing...</p>
                    </div>
                )}
            </div>

            {/* CSV Template */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                        <p className="font-semibold text-blue-900 mb-1">CSV Format Required</p>
                        <code className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded block mt-2 overflow-x-auto whitespace-nowrap">
                            flight_number,airline,origin,destination,departure_iso,arrival_iso,duration_min,price_real,base_price,seats_total,seats_available,flight_date
                        </code>
                        <button
                            onClick={downloadTemplate}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            📥 Download Template CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            {preview.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Preview (Last Upload Attempt)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Flight</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Airline</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Route</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {preview.map((flight, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{flight.flight_number}</td>
                                        <td className="px-4 py-3">{flight.airline}</td>
                                        <td className="px-4 py-3">{flight.origin} → {flight.destination}</td>
                                        <td className="px-4 py-3">{flight.flight_date}</td>
                                        <td className="px-4 py-3">₹{flight.base_price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {result && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Results</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="text-sm text-green-700">Successfully Uploaded</p>
                                    <p className="text-2xl font-bold text-green-900">{result.success}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <XCircleIcon className="w-8 h-8 text-red-600" />
                                <div>
                                    <p className="text-sm text-red-700">Failed</p>
                                    <p className="text-2xl font-bold text-red-900">{result.failed}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="font-semibold text-red-900 mb-2">Errors:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                                {result.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
