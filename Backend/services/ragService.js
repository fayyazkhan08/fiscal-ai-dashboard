const fs = require('fs');
const csv = require('fast-csv');
const lancedb = require('@lancedb/lancedb');
const { generateGroqChatCompletion } = require('./groqService');

let embed;

// Dynamically import transformers.js to avoid top-level await
const importTransformers = new Function('return import(\'@xenova/transformers\')');

/**
 * Initializes the embedding model if it hasn\'t been already.
 */
async function initializeEmbeddingModel() {
  if (embed) return;
  console.log('Initializing embedding model...');
  const { pipeline } = await importTransformers();
  embed = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('Embedding model initialized.');
}

/**
 * Processes a CSV file, generates embeddings, and stores them in LanceDB.
 * @param {string} filePath The path to the CSV file.
 * @returns {Promise<object[]>} The parsed JSON data from the CSV.
 */
async function processCSV(filePath) {
  await initializeEmbeddingModel();

  const jsonData = [];
  const stream = fs.createReadStream(filePath).pipe(csv.parse({ headers: true }));

  for await (const row of stream) {
    jsonData.push(row);
  }

  if (jsonData.length > 0) {
    console.log(`Processing ${jsonData.length} rows for embedding.`);
    // Improved data formatting for better semantic meaning
    const texts = jsonData.map(row => 
      Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    );

    const embeddings = await embed(texts, { pooling: 'mean', normalize: true });

    const dataForTable = texts.map((text, i) => ({
      text: text,
      vector: Array.from(embeddings.data.slice(i * 384, (i + 1) * 384)),
    }));

    const db = await lancedb.connect('vectordb');
    const tableNames = await db.tableNames();
    if (tableNames.includes('csv_data')) {
      await db.dropTable('csv_data');
    }

    console.log('Creating table and adding data...');
    await db.createTable('csv_data', dataForTable);
    console.log('Table created successfully.');
  }

  // Clean up the uploaded file after processing
  fs.unlinkSync(filePath);

  return jsonData;
}

/**
 * Queries the RAG system to generate an insight.
 * @param {string} userQuery The user\'s question.
 * @returns {Promise<string>} The generated insight.
 */
async function queryRAG(userQuery) {
  if (!embed) {
    throw new Error('RAG system not initialized. Please upload a CSV file first.');
  }

  console.log(`Generating embedding for query: ${userQuery}`);
  const queryEmbedding = await embed(userQuery, { pooling: 'mean', normalize: true });
  const queryVector = Array.from(queryEmbedding.data);

  const db = await lancedb.connect('vectordb');
  const table = await db.openTable('csv_data');

  console.log('Searching for relevant context...');
  const results = await table.search(queryVector).limit(25).execute();

  const context = Array.from(results).map(r => r.text).join('\n---\n');

  if (!context || context.trim() === '') {
    return "I could not find any relevant information in the document to answer your question.";
  }

  // Enhanced prompt for calculations and conceptual questions
  const prompt = `
    You are an expert data analyst. Your task is to answer the user's question based on the following snippets of data from a CSV file.

    Follow these steps:
    1.  **Analyze the User's Question:** Understand if the user is asking for a specific number, a calculation (like a total or average), or a conceptual explanation.
    2.  **Examine the Context:** Carefully read the provided data snippets.
    3.  **Synthesize the Answer:**
        *   If the user asks for a calculation (e.g., "total revenue"), identify all relevant numbers in the context and perform the calculation (e.g., sum them up). Show your work.
        *   If the user asks a conceptual question (e.g., "how to improve..."), synthesize the relevant information into a coherent, advisory answer.
        *   If the context does not contain enough information, state that clearly.

    --- CONTEXT ---
    ${context}
    --- END CONTEXT ---

    USER QUESTION:
    ${userQuery}

    ANALYST'S ANSWER (show your work for calculations):
  `;

  console.log('Generating insight with Groq...');
  return generateGroqChatCompletion(prompt);
}

module.exports = {
  processCSV,
  queryRAG,
};
