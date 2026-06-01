async function testChat() {
  const payload = {
    messages: [{ role: 'user', content: 'Hi Nemo, tell me one fun fact about space.' }],
    subject: 'science',
    locale: 'en',
    studentName: 'Test Student',
    gradeLevel: 'primary_1',
    isGreeting: false,
    model: 'llama-8b'
  };

  console.log('Sending chat request to NVIDIA API directly...');
  console.time('Direct NVIDIA API Time');
  
  try {
    const apiKey = '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';
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: 'Hi Nemo, tell me one fun fact about space.' }],
        temperature: 0.2,
        max_tokens: 128
      })
    });

    console.timeEnd('Direct NVIDIA API Time');
    console.log('Response Status:', response.status);
    const json = await response.json();
    console.log('Response content length:', JSON.stringify(json).length);
    if (json.choices && json.choices[0]) {
      console.log('Content preview:', json.choices[0].message.content.substring(0, 100) + '...');
    } else {
      console.log('Full JSON response:', json);
    }
  } catch (err) {
    console.error('Error during fetch:', err.message);
  }
}

testChat();
