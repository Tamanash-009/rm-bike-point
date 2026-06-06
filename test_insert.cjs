const fs = require('fs');
fetch('https://uctchotfaxlskxoddhct.supabase.co/rest/v1/bookings', {
  method: 'POST',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdGNob3RmYXhsc2t4b2RkaGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2MTYsImV4cCI6MjA5NjI1OTYxNn0.IJTENg16_SLkv79Dex4fCXkmPXj3KBKOgI8boOQlV3I',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdGNob3RmYXhsc2t4b2RkaGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2MTYsImV4cCI6MjA5NjI1OTYxNn0.IJTENg16_SLkv79Dex4fCXkmPXj3KBKOgI8boOQlV3I',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bikeModel: "Test",
    serviceType: "Test",
    phone: "Test",
    date: "2026-10-10",
    time: "10:00 AM",
    userId: "test",
    userName: "Test",
    userEmail: "test@example.com",
    status: "pending",
    pointsRedeemed: 0,
    discountAmount: 0,
    reminderSent: false
  })
}).then(res => res.json().then(data => console.log(res.status, data))).catch(err => console.error(err));
