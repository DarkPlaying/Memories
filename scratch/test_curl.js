const http = require("http");

http.get("http://localhost:3000/api/chat?startIndex=0&limit=40", (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    console.log("Headers:", res.headers);
    try {
      const parsed = JSON.parse(data);
      console.log("Parsed messages count:", parsed.messages ? parsed.messages.length : 0);
      if (parsed.messages && parsed.messages.length > 0) {
        console.log("First message preview:", parsed.messages[0]);
      } else {
        console.log("Full response body:", parsed);
      }
    } catch (e) {
      console.log("Failed to parse JSON. Raw body length:", data.length);
      console.log("Raw body prefix:", data.substring(0, 500));
    }
  });
}).on("error", (err) => {
  console.error("HTTP GET Error:", err);
});
