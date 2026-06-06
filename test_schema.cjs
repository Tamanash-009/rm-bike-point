fetch('https://uctchotfaxlskxoddhct.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdGNob3RmYXhsc2t4b2RkaGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2MTYsImV4cCI6MjA5NjI1OTYxNn0.IJTENg16_SLkv79Dex4fCXkmPXj3KBKOgI8boOQlV3I', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdGNob3RmYXhsc2t4b2RkaGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2MTYsImV4cCI6MjA5NjI1OTYxNn0.IJTENg16_SLkv79Dex4fCXkmPXj3KBKOgI8boOQlV3I',
  }
}).then(res => res.json().then(data => console.log(JSON.stringify(data.definitions || data.components?.schemas, null, 2)))).catch(err => console.error(err));
