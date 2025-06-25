
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 5000;

let PASSWORD = "balimoen123";

app.use(session({
  secret: "balimoen_secret_key",
  resave: false,
  saveUninitialized: false,
}));

function checkAuth(req, res, next) {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
}

const coinCategories = [
  { name: "1-19", minDuration: 20, maxDuration: 40 },
  { name: "20-199", minDuration: 20, maxDuration: 40 },
  { name: "200-499", minDuration: 20, maxDuration: 40 },
  { name: "500-1000", minDuration: 20, maxDuration: 40 },
  { name: "Galaxy", minDuration: 20, maxDuration: 40 },
  { name: "Interstellar", minDuration: 20, maxDuration: null },
  { name: "Universale", minDuration: 20, maxDuration: null },
  { name: "Abonnementje", minDuration: 20, maxDuration: null },
  { name: "Tippie", minDuration: 20, maxDuration: null }
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category;
    const categoryExists = coinCategories.find(cat => cat.name === category);
    if (!categoryExists) {
      return cb(new Error("Ongeldige categorie"));
    }
    const uploadPath = path.join("uploads", category);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + "-" + Date.now() + ext);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|ogg|mp4|mov|avi|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /audio|video/.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Alleen audio en video bestanden zijn toegestaan'));
    }
  }
});

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));

// Login pagina
app.get("/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="nl">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Login Balimoen</title>
    <style>
      body {
        background: #0d0d2b;
        color: #00ffff;
        font-family: Arial, sans-serif;
        display: flex;
        height: 100vh;
        justify-content: center;
        align-items: center;
      }
      form {
        background: #1a1a3a;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
      }
      input[type=password] {
        padding: 10px;
        border-radius: 5px;
        border: none;
        margin-bottom: 15px;
        width: 200px;
        font-size: 16px;
      }
      button {
        background: #00ffff;
        border: none;
        padding: 10px 25px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
      }
    </style>
    </head>
    <body>
      <form method="POST" action="/login">
        <h2>Balimoen Login</h2>
        <input type="password" name="password" placeholder="Wachtwoord" required />
        <br>
        <button type="submit">Inloggen</button>
      </form>
    </body>
    </html>
  `);
});

app.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    req.session.loggedIn = true;
    res.redirect("/streamer");
  } else {
    res.redirect("/login?error=1");
  }
});

// Publieke upload pagina (geen login vereist)
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="nl">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Balimoen Sounds Upload</title>
    <style>
      body {
        background: #0d0d2b;
        color: #fff;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 50px;
      }
      h1 {
        color: #00ffff;
      }
      .box {
        background: #1a1a3a;
        padding: 20px;
        border-radius: 10px;
        display: inline-block;
        margin-bottom: 10px;
        max-width: 400px;
      }
      button {
        background: #00ffff;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
      }
      select, input[type=file] {
        width: 100%;
        padding: 8px;
        margin-top: 10px;
        margin-bottom: 15px;
        border-radius: 5px;
        border: none;
        font-size: 16px;
      }
      .requirements {
        background: #2a2a4a;
        padding: 15px;
        border-radius: 5px;
        margin: 20px auto;
        max-width: 400px;
        text-align: left;
      }
      .requirements h3 {
        color: #00ffff;
        margin-top: 0;
      }
      .requirements p {
        margin: 5px 0;
        font-size: 14px;
      }
      a.logout {
        display: inline-block;
        margin-top: 20px;
        color: #00ffff;
        font-weight: bold;
        text-decoration: none;
      }
    </style>
    <script>
    function updateRequirements() {
      const category = document.getElementById("category").value;
      const requirements = document.getElementById("requirements");
      
      const categoryData = {
        "1-19": { min: 20, max: 40 },
        "20-199": { min: 20, max: 40 },
        "200-499": { min: 20, max: 40 },
        "500-1000": { min: 20, max: 40 },
        "Galaxy": { min: 20, max: 40 },
        "Interstellar": { min: 20, max: null },
        "Universale": { min: 20, max: null },
        "Abonnementje": { min: 20, max: null },
        "Tippie": { min: 20, max: null }
      };
      
      if (categoryData[category]) {
        const data = categoryData[category];
        let durationText = \`Minimaal \${data.min} seconden\`;
        if (data.max) {
          durationText += \`, maximaal \${data.max} seconden\`;
        }
        requirements.innerHTML = \`
          <h3>Eisen voor \${category}:</h3>
          <p>• \${durationText}</p>
          <p>• Audio (mp3, wav, m4a, ogg) of Video (mp4, mov, avi, webm, mkv)</p>
          <p>• Geen ongepaste inhoud</p>
        \`;
      }
    }
    </script>
    </head>
    <body>
      <h1>🎵 Balimoen Sounds Upload</h1>
      
      <div class="box">
        <form method="POST" action="/upload" enctype="multipart/form-data">
          <h2>Upload je sound</h2>
          
          <select id="category" name="category" required onchange="updateRequirements()">
            <option value="">Kies een categorie</option>
            ${coinCategories.map(cat => {
              const specialCategories = ['Galaxy', 'Interstellar', 'Universale', 'Tippie', 'Abonnementje'];
              const displayName = specialCategories.includes(cat.name) ? cat.name : `${cat.name} coins`;
              return `<option value="${cat.name}">${displayName}</option>`;
            }).join('')}
          </select>
          
          <input type="file" name="audio" accept="audio/*,video/*" required />
          
          <br>
          <button type="submit">Upload Sound</button>
        </form>
      </div>
      
      <div id="requirements" class="requirements">
        <h3>Selecteer een categorie</h3>
        <p>Kies eerst een categorie om de eisen te zien</p>
        <p><em>Toegestaan: Audio en Video bestanden</em></p>
      </div>
      
      <div style="margin-top: 30px;">
        <a href="/login" style="color: #00ffff; text-decoration: none; font-size: 14px;">🔒 Streamer Login</a>
      </div>
      
      </body>
    </html>
  `);
});

// Upload handler (geen login vereist)
app.post("/upload", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.send(`
      <script>
        alert('Geen bestand geselecteerd!');
        window.location.href = '/';
      </script>
    `);
  }

  const category = req.body.category;
  const categoryData = coinCategories.find(cat => cat.name === category);
  
  if (!categoryData) {
    return res.send(`
      <script>
        alert('Ongeldige categorie!');
        window.location.href = '/';
      </script>
    `);
  }

  res.send(`
    <script>
      alert('Sound succesvol geüpload naar ${category}!');
      window.location.href = '/';
    </script>
  `);
});

// Streamer admin dashboard
app.get("/streamer", checkAuth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="nl">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Balimoen Streamer Admin</title>
    <style>
      body {
        background: #0d0d2b;
        color: #fff;
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      h1 {
        color: #00ffff;
        text-align: center;
      }
      .tabs {
        display: flex;
        justify-content: center;
        margin: 30px 0;
        gap: 10px;
      }
      .tab {
        background: #1a1a3a;
        padding: 15px 25px;
        border-radius: 10px;
        cursor: pointer;
        border: 2px solid transparent;
        text-decoration: none;
        color: #fff;
      }
      .tab.active {
        border-color: #00ffff;
        background: #2a2a4a;
      }
      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: block;
      }
      .logout {
        display: inline-block;
        margin-top: 20px;
        background: #00ffff;
        color: #0d0d2b;
        padding: 10px 20px;
        border-radius: 5px;
        font-weight: bold;
        text-decoration: none;
      }
      .upload-link {
        text-align: center;
        margin: 20px 0;
      }
      .upload-link a {
        background: #1a1a3a;
        padding: 15px 25px;
        border-radius: 10px;
        display: inline-block;
        text-decoration: none;
      }
    </style>
    <script>
      function showTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(tabName).classList.add('active');
        
        // Add active class to clicked tab
        event.target.classList.add('active');
      }
    </script>
    </head>
    <body>
      <h1>🎵 Balimoen Streamer Admin</h1>
      
      <div class="upload-link">
        <a href="/">← Ga naar upload pagina</a>
      </div>
      
      <div class="tabs">
        <div class="tab active" onclick="showTab('downloads')">Downloads</div>
        <div class="tab" onclick="showTab('uploads')">Upload Overzicht</div>
        <div class="tab" onclick="showTab('settings')">Instellingen</div>
      </div>
      
      <div id="downloads" class="tab-content active">
        <iframe src="/downloads" style="width: 100%; height: 600px; border: none; border-radius: 10px;"></iframe>
      </div>
      
      <div id="uploads" class="tab-content">
        <iframe src="/uploads-overview" style="width: 100%; height: 600px; border: none; border-radius: 10px;"></iframe>
      </div>
      
      <div id="settings" class="tab-content">
        <iframe src="/settings" style="width: 100%; height: 600px; border: none; border-radius: 10px;"></iframe>
      </div>
      
      <a href="/logout" class="logout">Uitloggen</a>
    </body>
    </html>
  `);
});

// Downloads pagina (aparte route)
app.get("/downloads", checkAuth, (req, res) => {
  const uploadsDir = "uploads";
  let filesList = "";
  
  try {
    coinCategories.forEach(category => {
      const categoryPath = path.join(uploadsDir, category.name);
      if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath);
        if (files.length > 0) {
          filesList += `<h3>${category.name} coins (${files.length} bestanden)</h3><ul>`;
          files.forEach(file => {
            filesList += `<li><a href="/download/${category.name}/${encodeURIComponent(file)}" download>${file}</a></li>`;
          });
          filesList += "</ul>";
        }
      }
    });
    
    if (!filesList) {
      filesList = "<p>Nog geen uploads beschikbaar.</p>";
    }
  } catch (error) {
    filesList = "<p>Fout bij laden van bestanden.</p>";
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="nl">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Downloads</title>
    <style>
      body {
        background: #0d0d2b;
        color: #fff;
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      h3 {
        color: #00ffff;
        margin-top: 30px;
        margin-bottom: 10px;
      }
      ul {
        list-style: none;
        padding: 0;
        background: #1a1a3a;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
      }
      ul li {
        padding: 8px 0;
        border-bottom: 1px solid #00ffff33;
      }
      ul li:last-child {
        border-bottom: none;
      }
      a {
        color: #00ffff;
        text-decoration: none;
        font-weight: bold;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
    </head>
    <body>
      ${filesList}
    </body>
    </html>
  `);
});

// Upload overzicht pagina
app.get("/uploads-overview", checkAuth, (req, res) => {
  const uploadsDir = "uploads";
  let uploadsData = [];
  
  try {
    coinCategories.forEach(category => {
      const categoryPath = path.join(uploadsDir, category.name);
      if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath);
        files.forEach(file => {
          const filePath = path.join(categoryPath, file);
          const stats = fs.statSync(filePath);
          const uploadTime = stats.birthtime;
          
          // Extract timestamp from filename
          const timestampMatch = file.match(/-(\d+)\./);
          const timestamp = timestampMatch ? timestampMatch[1] : 'onbekend';
          
          uploadsData.push({
            filename: file,
            category: category.name,
            uploadTime: uploadTime.toLocaleString('nl-NL'),
            size: (stats.size / 1024).toFixed(2) + ' KB',
            timestamp: timestamp
          });
        });
      }
    });
    
    // Sort by upload time (newest first)
    uploadsData.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
    
  } catch (error) {
    console.error("Error loading uploads:", error);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="nl">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Upload Overzicht</title>
    <style>
      body {
        background: #0d0d2b;
        color: #fff;
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: #1a1a3a;
        border-radius: 10px;
        overflow: hidden;
      }
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #00ffff33;
      }
      th {
        background: #2a2a4a;
        color: #00ffff;
        font-weight: bold;
      }
      tr:hover {
        background: #2a2a4a;
      }
      .delete-btn {
        background: #ff4444;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      }
      .delete-btn:hover {
        background: #ff6666;
      }
      .category-badge {
        background: #00ffff;
        color: #0d0d2b;
        padding: 2px 8px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: bold;
      }
    </style>
    </head>
    <body>
      <h2 style="color: #00ffff;">Upload Overzicht (${uploadsData.length} bestanden)</h2>
      
      ${uploadsData.length === 0 ? 
        '<p>Nog geen uploads beschikbaar.</p>' : 
        `<table>
          <thead>
            <tr>
              <th>Bestandsnaam</th>
              <th>Categorie</th>
              <th>Upload Tijd</th>
              <th>Grootte</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            ${uploadsData.map(upload => `
              <tr>
                <td>${upload.filename}</td>
                <td><span class="category-badge">${upload.category}</span></td>
                <td>${upload.uploadTime}</td>
                <td>${upload.size}</td>
                <td>
                  <a href="/download/${upload.category}/${encodeURIComponent(upload.filename)}" download style="color: #00ffff; margin-right: 10px;">Download</a>
                  <button class="delete-btn" onclick="deleteFile('${upload.category}', '${upload.filename}')">Verwijder</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
      }
      
      <script>
        function deleteFile(category, filename) {
          if (confirm('Weet je zeker dat je dit bestand wilt verwijderen?')) {
            fetch('/delete-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category, filename })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                location.reload();
              } else {
                alert('Fout bij verwijderen: ' + data.error);
              }
            });
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Instellingen pagina
app.get("/settings", checkAuth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="nl">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Instellingen</title>
    <style>
      body {
        background: #0d0d2b;
        color: #fff;
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      .settings-box {
        background: #1a1a3a;
        padding: 25px;
        border-radius: 10px;
        margin-bottom: 20px;
        max-width: 500px;
      }
      .settings-box h3 {
        color: #00ffff;
        margin-top: 0;
      }
      input[type=password] {
        width: 100%;
        padding: 12px;
        border-radius: 5px;
        border: none;
        margin-bottom: 15px;
        font-size: 16px;
        box-sizing: border-box;
      }
      button {
        background: #00ffff;
        border: none;
        padding: 12px 25px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
      }
      button:hover {
        background: #00cccc;
      }
      .success {
        color: #00ff00;
        margin-top: 10px;
      }
      .error {
        color: #ff4444;
        margin-top: 10px;
      }
    </style>
    </head>
    <body>
      <div class="settings-box">
        <h3>🔐 Wachtwoord Wijzigen</h3>
        <form id="passwordForm">
          <input type="password" id="currentPassword" placeholder="Huidig wachtwoord" required />
          <input type="password" id="newPassword" placeholder="Nieuw wachtwoord" required />
          <input type="password" id="confirmPassword" placeholder="Bevestig nieuw wachtwoord" required />
          <button type="submit">Wachtwoord Wijzigen</button>
        </form>
        <div id="message"></div>
      </div>
      
      <div class="settings-box">
        <h3>📊 Server Statistieken</h3>
        <p><strong>Totaal aantal uploads:</strong> <span id="totalUploads">Laden...</span></p>
        <p><strong>Server gestart:</strong> ${new Date().toLocaleString('nl-NL')}</p>
        <p><strong>Huidige wachtwoord:</strong> ********</p>
      </div>
      
      <script>
        // Load statistics
        fetch('/stats')
          .then(response => response.json())
          .then(data => {
            document.getElementById('totalUploads').textContent = data.totalUploads;
          });
        
        // Handle password change
        document.getElementById('passwordForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const currentPassword = document.getElementById('currentPassword').value;
          const newPassword = document.getElementById('newPassword').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const messageDiv = document.getElementById('message');
          
          if (newPassword !== confirmPassword) {
            messageDiv.innerHTML = '<div class="error">Nieuwe wachtwoorden komen niet overeen!</div>';
            return;
          }
          
          if (newPassword.length < 6) {
            messageDiv.innerHTML = '<div class="error">Nieuw wachtwoord moet minimaal 6 karakters zijn!</div>';
            return;
          }
          
          fetch('/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              messageDiv.innerHTML = '<div class="success">Wachtwoord succesvol gewijzigd!</div>';
              document.getElementById('passwordForm').reset();
            } else {
              messageDiv.innerHTML = '<div class="error">Fout: ' + data.error + '</div>';
            }
          });
        });
      </script>
    </body>
    </html>
  `);
});

// Download endpoint
app.get("/download/:category/:filename", checkAuth, (req, res) => {
  const { category, filename } = req.params;
  const filePath = path.join("uploads", category, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send("Bestand niet gevonden");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// API endpoints
app.use(express.json());

// Delete file endpoint
app.post("/delete-file", checkAuth, (req, res) => {
  const { category, filename } = req.body;
  const filePath = path.join("uploads", category, filename);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Bestand niet gevonden" });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Change password endpoint
app.post("/change-password", checkAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (currentPassword !== PASSWORD) {
    return res.json({ success: false, error: "Huidig wachtwoord is incorrect" });
  }
  
  if (newPassword.length < 6) {
    return res.json({ success: false, error: "Nieuw wachtwoord moet minimaal 6 karakters zijn" });
  }
  
  // Update password (in a real app, this would update a database)
  // For this demo, we'll just update the global variable
  PASSWORD = newPassword;
  
  res.json({ success: true });
});

// Statistics endpoint
app.get("/stats", checkAuth, (req, res) => {
  let totalUploads = 0;
  
  try {
    coinCategories.forEach(category => {
      const categoryPath = path.join("uploads", category.name);
      if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath);
        totalUploads += files.length;
      }
    });
  } catch (error) {
    console.error("Error counting uploads:", error);
  }
  
  res.json({ totalUploads });
});

// Error handler
app.use((error, req, res, next) => {
  res.send(`
    <script>
      alert('Error: ${error.message}');
      window.location.href = '/';
    </script>
  `);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server draait op http://0.0.0.0:${PORT}`);
});
