import { ManualPDFLoader } from '@/utils/manualPDFLoader';
import { createSupabaseClient } from '@/utils/supabase-client';
import { DirectoryLoader } from 'langchain/document_loaders';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';

const filePath = 'docs';

export const run = async () => {
  try {

    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path: string) => new ManualPDFLoader(path),
    });

    const rawDocs = await directoryLoader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    const embeddings = new OpenAIEmbeddings({modelName: "text-embedding-3-small"});


    const client = createSupabaseClient({
      url: process.env.SUPABASE_URL,
      privateKey: process.env.SUPABASE_PRIVATE_KEY,
    });

    await SupabaseVectorStore.fromDocuments(docs, embeddings, {
      client,
      tableName: 'documents',
      queryName: 'match_documents',
    });

  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();
