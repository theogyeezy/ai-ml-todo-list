import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_BEDROCK_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_BEDROCK_SECRET_ACCESS_KEY,
  },
});

// Convert image file to base64
const imageToBase64 = (imageFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data:image/jpeg;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

// Extract text from image using Claude 3 Sonnet via Bedrock
export const extractTextWithBedrock = async (imageFile) => {
  try {
    console.log('Processing image with Amazon Bedrock Claude Vision...');
    
    // Convert image to base64
    const base64Image = await imageToBase64(imageFile);
    
    // Prepare the request payload for Claude 3 Sonnet
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageFile.type || "image/jpeg",
                data: base64Image
              }
            },
            {
              type: "text",
              text: `Please extract all text from this image, especially focusing on todo items, tasks, or notes. 

Here's what I need:
1. Extract ALL readable text, even if handwriting is messy
2. Preserve line breaks and formatting where possible
3. If you see bullet points, numbers, or task-like items, include them
4. Don't correct spelling - extract exactly what you see
5. If some text is unclear, make your best guess

Please provide only the extracted text, nothing else.`
            }
          ]
        }
      ]
    };

    // Invoke Claude 3.5 Sonnet v2 model
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
      contentType: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    
    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      const extractedText = responseBody.content[0].text.trim();
      console.log('Bedrock Claude extracted text:', extractedText);
      return extractedText;
    } else {
      throw new Error('No text content in Bedrock response');
    }

  } catch (error) {
    console.error('Bedrock vision error:', error);
    
    // Provide specific error messages
    if (error.name === 'ValidationException') {
      throw new Error('Invalid image format. Please use JPG, PNG, GIF, or WebP images.');
    } else if (error.name === 'AccessDeniedException') {
      throw new Error('Access denied to Amazon Bedrock. Please check your AWS credentials and permissions.');
    } else if (error.name === 'ThrottlingException') {
      throw new Error('Too many requests. Please wait a moment and try again.');
    } else if (error.message && error.message.includes('model')) {
      throw new Error('Claude vision model is temporarily unavailable. Please try again later.');
    } else {
      throw new Error('Failed to process image with AI vision. Please try again.');
    }
  }
};

// Alternative: Extract text using other Bedrock vision models
export const extractTextWithBedrockAlternative = async (imageFile) => {
  try {
    console.log('Trying alternative Bedrock vision model...');
    
    const base64Image = await imageToBase64(imageFile);
    
    // Try with Claude 3 Haiku (faster, cheaper alternative)
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 800,
      messages: [
        {
          role: "user", 
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageFile.type || "image/jpeg", 
                data: base64Image
              }
            },
            {
              type: "text",
              text: "Extract all text from this image. Focus on todo items, tasks, and notes. Include messy handwriting - make your best guess. Return only the extracted text."
            }
          ]
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json", 
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      return responseBody.content[0].text.trim();
    } else {
      throw new Error('No text extracted from alternative model');
    }

  } catch (error) {
    console.error('Alternative Bedrock model failed:', error);
    throw error;
  }
};