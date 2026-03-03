import React, { useState } from 'react';

// Define types for our state
interface CsvRow {
  [key: string]: string;
}

const RAGAnalysis = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      if (selectedFile && selectedFile.type === 'text/csv') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a .csv file.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError('');
    setCsvData([]);
    setInsight('');
    setCurrentPage(1); // Reset to first page on new upload

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/rag/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to upload file.');
      }

      const result = await response.json();
      setCsvData(result.data);
      if (result.data && result.data.length > 0) {
        setCsvHeaders(Object.keys(result.data[0]));
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    if (!query) return;

    setIsLoading(true);
    setError('');
    setInsight('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to generate insight.');
      }

      const result = await response.json();
      setInsight(result.insight);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(csvData.length / rowsPerPage);
  const currentRows = csvData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const PaginationControls = () => (
    <div className="flex justify-between items-center p-2 text-xs text-gray-600">
      <button onClick={goToPreviousPage} disabled={currentPage === 1} className="btn btn-secondary">
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={goToNextPage} disabled={currentPage === totalPages} className="btn btn-secondary">
        Next
      </button>
    </div>
  );

  return (
    <div>
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">1. Upload CSV File</h3>
        </div>
        <div className="p-4">
          <p className="mb-2 text-sm text-gray-600">Upload a CSV file to analyze. The system will process the data, enabling you to ask questions about its contents.</p>
          <input type="file" accept=".csv" onChange={handleFileChange} className="mb-2" />
          <button onClick={handleUpload} disabled={!file || isLoading} className="btn btn-primary">
            {isLoading && csvData.length === 0 ? 'Processing...' : 'Upload and Process'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card my-4 bg-red-100 border-red-400">
           <div className="card-header">
            <h3 className="card-title">Error</h3>
          </div>
          <div className="p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {csvData.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title">CSV Data</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  {csvHeaders.map(header => <th key={header} className="p-2">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b">
                    {csvHeaders.map(header => <td key={header} className="p-2">{row[header]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <PaginationControls />}
        </div>
      )}

      {csvData.length > 0 && (
         <div className="card">
          <div className="card-header">
            <h3 className="card-title">2. Ask a Question</h3>
          </div>
          <div className="p-4">
             <p className="mb-2 text-sm text-gray-600">Now ask a question about the data you uploaded. The AI will generate an insight based on the relevant information in the file.</p>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'What is the total revenue?' or 'Which state has the highest expenditure?'"
              className="w-full p-2 border rounded mb-2"
              rows={3}
            />
            <button onClick={handleGenerateInsight} disabled={!query || isLoading} className="btn btn-primary">
              {isLoading && insight === '' ? 'Generating...' : 'Generate Insight'}
            </button>
          </div>
        </div>
      )}

      {insight && (
        <div className="card mt-4 bg-green-50">
           <div className="card-header">
            <h3 className="card-title">Generated Insight</h3>
          </div>
          <div className="p-4">
            <p className="text-green-800 whitespace-pre-wrap">{insight}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RAGAnalysis;