import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from backend root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
  console.log('🔍 First, let\'s list ALL available models for your API key...\n');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Try to list models using the API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      console.error('❌ Failed to fetch models list');
      console.log('Status:', response.status);
      console.log('Response:', await response.text());
      return;
    }
    
    const data = await response.json();
    
    console.log('📋 Available models:\n');
    
    if (data.models && Array.isArray(data.models)) {
      for (const model of data.models) {
        console.log(`- ${model.name}`);
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`  ✅ Supports generateContent`);
        }
      }
      
      console.log('\n\n🧪 Now testing models that support generateContent:\n');
      
      // Test only models that support generateContent
      const compatibleModels = data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));
      
      for (const modelName of compatibleModels) {
        try {
          console.log(`Testing: ${modelName}...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent('Say hello in one word');
          const response = await result.response;
          const text = response.text();
          console.log(`✅ ${modelName} - WORKS! Response: ${text}\n`);
        } catch (error: any) {
          console.log(`❌ ${modelName} - ${error.message}\n`);
        }
      }
    } else {
      console.log('No models found in response');
      console.log('Response data:', JSON.stringify(data, null, 2));
    }
    
    console.log('\n✨ Model check complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

listModels().catch(console.error);