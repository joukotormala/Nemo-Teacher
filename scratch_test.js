const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "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";
(async () => {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello!" }
      ],
      stream: true,
      max_tokens: 800,
      temperature: 0.7,
    }),
  };
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", fetchOptions);
  if (!res.ok) {
    console.error("Error:", res.status, await res.text());
    return;
  }
  const text = await res.text();
  console.log("Stream Output:\\n" + text);
})();
