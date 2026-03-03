const ragService = require('../services/ragService');

/**
 * Handles the CSV file upload and processing.
 */
async function uploadAndProcessCsv(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const jsonData = await ragService.processCSV(req.file.path);
    res.status(200).json({ 
      message: 'CSV processed successfully. You can now ask questions.',
      data: jsonData 
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ message: 'Failed to process CSV file.', error: error.message });
  }
}

/**
 * Generates an insight based on a user query.
 */
async function generateInsight(req, res) {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Query is required.' });
  }

  try {
    const insight = await ragService.queryRAG(query);
    res.status(200).json({ insight });
  } catch (error) {
    console.error('Error generating insight:', error);
    res.status(500).json({ message: 'Failed to generate insight.', error: error.message });
  }
}

module.exports = {
  uploadAndProcessCsv,
  generateInsight,
};
